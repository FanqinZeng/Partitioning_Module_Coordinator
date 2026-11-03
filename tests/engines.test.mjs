import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {run,G01,BAD,GOOD,metrics,exact,clone} from '../site/engines/course.js';
import {randomGraph,cutsize} from '../site/engines/graph.js';
import * as FM from '../site/engines/fm.js';
import * as Spectral from '../site/engines/spectral.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);

test('shared cut, area and feasibility contracts',()=>{
 assert.equal(metrics(G01,BAD).cut,12);assert.equal(metrics(G01,GOOD).cut,3);
 near(metrics(G01,GOOD).ratio,2/3);near(metrics(G01,GOOD).imbalance,.2);
 const g=clone(G01);g.nodes[0].size=4;assert.deepEqual(metrics(g,GOOD).areas,[6,2]);assert.equal(metrics(g,GOOD,2,4).feasible,false);
 assert.throws(()=>metrics(G01,{A:0}));assert.throws(()=>metrics(G01,GOOD,2,-1));
});
test('all seven engines calculate the published common-graph examples',()=>{
 const expected={metrics:12,initial:5,kl:3,fm:3,spectral:3,recursive:8,multiway:8};
 for(const [method,cut]of Object.entries(expected)){const r=run(method,G01);assert.equal(r.status,'completed');assert.equal(r.result.metrics.cut,cut);for(const e of r.events)assert.equal(e.metrics.cut,cutsize(r.graph,e.assignment));}
 assert.equal(run('multiway',G01,{strategy:'round-robin',k:3}).result.metrics.cut,18);
 assert.deepEqual(run('kl',G01).result.passes[0].swaps.map(s=>s.gain),[9,-8]);
 assert.equal(run('fm',G01).result.passes[0].moves[0].node,'D');
});
test('invalid graph and parameters do not become plausible traces',()=>{
 const invalids=[{}, {nodes:['A','A'],edges:[]},{nodes:['A','B'],edges:[['A','C',1]]},{nodes:['A','B'],edges:[['A','B',-1]]},{nodes:['A','B'],edges:[['A','B',1],['B','A',2]]},{nodes:['constructor','A'],edges:[]}];
 for(const g of invalids){const r=run('kl',g);assert.equal(r.status,'invalid');assert.deepEqual(r.events,[]);}
 for(const p of [{k:99},{k:2.5},{capacity:-1},{minFraction:.6}])assert.equal(run('multiway',G01,p).status,'invalid');
 assert.equal(run('initial',G01,{seed:NaN}).status,'invalid');
 assert.equal(run('fm',G01,{maxDiff:0}).status,'invalid');
 assert.equal(run('fm',{nodes:['A','B'],edges:[],nets:[{pins:['A','B'],w:3}]}).status,'invalid');
});
test('mixed-case vertex ties use code-point order consistently with Python',()=>{
 const graph={nodes:['a','B','A','b'],edges:[]};
 const r=run('initial',graph,{strategy:'grow'});assert.equal(r.events[0].chosen,'A');assert.equal(r.events[1].chosen,'B');
});
test('KL/FM agree pass by pass with an independent brute-change Python solver on 240 cases',()=>{
 const cases=[];
 for(let seed=1;seed<=120;seed++){
  const n=3+seed%6,g=randomGraph(seed,{n,p:.45,maxW:9,sizes:true}),initial=Object.fromEntries(g.nodes.map((v,i)=>[v.id,i<Math.floor(n/2)?0:1]));
  for(const method of ['kl','fm'])cases.push({graph:g,initial,method,maxDiff:n%2?1:2,maxPasses:10});
 }
 const py=spawnSync('python3',['tests/independent_ref.py'],{input:JSON.stringify(cases),encoding:'utf8',maxBuffer:5e6});assert.equal(py.status,0,py.stderr);
 const expected=JSON.parse(py.stdout);
 cases.forEach((c,i)=>{
  const r=run(c.method,c.graph,c),ref=expected[i];assert.equal(r.result.metrics.cut,ref.cut,`${c.method} case ${i}`);assert.deepEqual(r.result.assignment,ref.assignment);
  const passes=r.result.passes.map(p=>{const steps=p.swaps||p.moves;return {gains:steps.map(s=>s.gain),chosen:steps.map(s=>s.node?[s.node]:[s.a,s.b]),bestK:p.bestK,cut:p.acceptedCut};});assert.deepEqual(passes,ref.passes);
  for(const p of r.result.passes){assert.ok(p.acceptedCut<=p.startCut);const steps=p.swaps||p.moves;const used=steps.flatMap(s=>s.node?[s.node]:[s.a,s.b]);assert.equal(new Set(used).size,used.length);}
  for(const e of r.events)if(e.before&&e.trialGain!==undefined){near(cutsize(r.graph,e.before)-cutsize(r.graph,e.assignment),e.trialGain);if(c.method==='kl')assert.deepEqual(e.metrics.counts,[Math.floor(c.graph.nodes.length/2),Math.ceil(c.graph.nodes.length/2)]);else assert.ok(Math.abs(e.metrics.counts[0]-e.metrics.counts[1])<=c.maxDiff);}
 });
});
test('FM may escape using negative-gain trials; hypernet gains match actual cut changes',()=>{
 const r=FM.run(FM.NEG_ESCAPE,{initial:FM.NEG_ESCAPE.seed,maxDiff:2});assert.equal(r.result.cut,4);assert.deepEqual(r.result.passes[0].moves.slice(0,3).map(m=>m.gain),[-1,-1,4]);
 const input={nodes:['A','B','C','D'],nets:[{pins:['A','B','C'],w:3},{pins:['B','D'],w:2}]},side={A:0,B:0,C:1,D:1},{ids,nets}=FM.toNets(input),gains=FM.gainsFromScratch(nets,side,ids);
 for(const node of ids){const changed={...side,[node]:1-side[node]};assert.equal(gains[node].gain,FM.netCut(nets,side)-FM.netCut(nets,changed));}
});
test('spectral solves the matrix live and sweeps the declared count window',()=>{
 const r=run('spectral',G01).result;assert.deepEqual(r.L[0],[6,-5,-1,0,0]);assert.deepEqual(r.order,['E','D','C','B','A']);assert.deepEqual(r.sweep.map(s=>s.cut),[6,3,5,6]);assert.ok(r.diagnostics.residual<1e-9);assert.ok(r.diagnostics.orthogonalityToOnes<1e-9);
 for(let seed=1;seed<=80;seed++){
  const g=randomGraph(seed+1000,{n:3+seed%6,p:.5}),r=run('spectral',g).result;assert.ok(r.diagnostics.residual<1e-7);assert.ok(r.L.every(row=>Math.abs(row.reduce((s,x)=>s+x,0))<1e-8));assert.equal(r.cut,Math.min(...r.sweep.filter(s=>s.legal).map(s=>s.cut)));
 }
 assert.equal(run('spectral',G01,{minFraction:.5}).status,'infeasible');
 assert.equal(Spectral.run(Spectral.DISCONNECTED).result.diagnostics.connected,false);
 assert.equal(Spectral.run(Spectral.DEGENERATE).result.diagnostics.degenerate,true);
});
test('recursive splits recompute subgraphs and count the full cut once',()=>{
 const r=run('recursive',G01,{k:3});assert.deepEqual(r.events.map(e=>e.metrics.cut),[0,3,8]);assert.equal(r.events[2].addedCut,5);
 for(let seed=1;seed<=80;seed++){
  const graph=randomGraph(seed+2000,{n:3+seed%6}),k=2+seed%2,trace=run('recursive',graph,{k});assert.equal(trace.status,'completed');assert.equal(trace.events.length,k);assert.equal(new Set(Object.values(trace.result.assignment)).size,k);
  let previous=0;for(const e of trace.events.slice(1)){assert.ok(e.metrics.cut>=previous);assert.equal(e.metrics.cut-previous,e.addedCut);previous=e.metrics.cut;assert.deepEqual(e.members.slice().sort(),e.children.flat().sort());}
 }
});
test('k-way feasibility and exact calibration stay separate from cut quality',()=>{
 assert.equal(exact(G01,{k:3,capacity:2}).best.cut,8);assert.equal(run('multiway',G01,{capacity:1,k:3}).status,'infeasible');
 const g=clone(G01);g.edges[0].w=1;assert.equal(run('multiway',g,{k:3,strategy:'round-robin'}).result.metrics.cut,14);assert.equal(run('multiway',g,{k:3}).result.metrics.cut,5);
 for(let seed=1;seed<=50;seed++){
  const g=randomGraph(seed+3000,{n:6,p:.5}),r=run('multiway',g,{k:3}),opt=exact(g,{k:3});assert.ok(r.result.metrics.cut>=opt.best.cut);const swaps=r.events.filter(e=>e.kind==='swap');for(const e of swaps)assert.ok(e.gain>0);assert.ok(r.result.metrics.nonempty);
 }
});
