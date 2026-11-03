// Unified course contract. All visual states are actual solver states.
import {requireGraph, cutsize, weightMap, mulberry32, compareKeys, G01} from './graph.js';
import * as KL from './kl.js';
import * as FM from './fm.js';
import * as Spectral from './spectral.js';
export {G01};
export const BAD = {A:0,B:1,C:1,D:1,E:0};
export const GOOD = {A:0,B:0,C:0,D:1,E:1};
export const METHODS = ['metrics','initial','kl','fm','spectral','recursive','multiway'];
export const clone = x => JSON.parse(JSON.stringify(x));
const count = (g,a,p) => g.nodes.filter(n=>a[n.id]===p).length;

export function metrics(input, assignment, k=2, capacity=null) {
  const g=requireGraph(input), ids=g.nodes.map(n=>n.id);
  if (!Number.isInteger(k)||k<2||k>ids.length) throw Error('k must be between 2 and the node count');
  if (!assignment || ids.some(id=>!Number.isInteger(assignment[id])||assignment[id]<0||assignment[id]>=k) || Object.keys(assignment).some(id=>!ids.includes(id))) throw Error('Assignment must map every node exactly once to a group 0 … k−1');
  if (capacity!==null && (!Number.isFinite(capacity)||capacity<=0)) throw Error('Capacity must be positive');
  const counts=Array.from({length:k},(_,i)=>count(g,assignment,i));
  const areas=Array(k).fill(0);g.nodes.forEach(n=>areas[assignment[n.id]]+=n.size);
  const totalArea=areas.reduce((s,x)=>s+x,0), lo=Math.min(...areas),hi=Math.max(...areas);
  return {cut:cutsize(g,assignment),counts,areas,ratio:lo/hi,imbalance:(hi-lo)/totalArea,
    nonempty:counts.every(x=>x>0),feasible:counts.every(x=>x>0)&&(capacity===null||areas.every(x=>x<=capacity+1e-9)),
    capacity,cutEdges:g.edges.filter(e=>assignment[e.u]!==assignment[e.v])};
}

function event(kind,assignment,detail={}) {return {kind,assignment:{...assignment},...detail};}
function initialRun(g,{strategy='grow',seed=7}={}) {
  if(!['grow','greedy','random'].includes(strategy))throw Error('Unknown initial strategy');
  const ids=g.nodes.map(n=>n.id).sort(), adj=weightMap(g), target=Math.floor(ids.length/2), a=Object.fromEntries(ids.map(id=>[id,1])), history=[];
  if(strategy==='random') {
    const order=[...ids],rnd=mulberry32(seed);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    order.slice(0,target).forEach(id=>a[id]=0);
    history.push(event('shuffle',a,{order,seed}));
  } else if(strategy==='grow') {
    a[ids[0]]=0;history.push(event('seed',a,{chosen:ids[0]}));
    while(count(g,a,0)<target) {
      const candidates=ids.filter(id=>a[id]===1).map(id=>({node:id,score:[...adj.get(id)].filter(([u])=>a[u]===0).reduce((s,[,w])=>s+w,0)})).sort((x,y)=>y.score-x.score||compareKeys([x.node],[y.node]));
      const best=candidates[0];a[best.node]=0;history.push(event('grow',a,{candidates,chosen:best.node}));
    }
  } else {
    const placed=new Set([ids[0]]);a[ids[0]]=0;history.push(event('seed',a,{chosen:ids[0]}));
    const capacities=[target,ids.length-target];
    for(const id of ids.slice(1)) {
      const used=[0,0];placed.forEach(u=>used[a[u]]++);
      const candidates=[0,1].map(side=>({side,legal:used[side]<capacities[side],increment:[...adj.get(id)].filter(([u])=>placed.has(u)&&a[u]!==side).reduce((s,[,w])=>s+w,0)}));
      const best=candidates.filter(c=>c.legal).sort((x,y)=>x.increment-y.increment||used[x.side]-used[y.side]||x.side-y.side)[0];
      a[id]=best.side;placed.add(id);history.push(event('place',a,{node:id,chosen:best.side,candidates,placed:[...placed]}));
    }
  }
  return {events:history,result:{assignment:a,cut:cutsize(g,a)},status:'completed'};
}

function spectralRun(g,params={}) {
  const raw=Spectral.run(g,{balance:{minFraction:params.minFraction??0.2,maxFraction:1-(params.minFraction??0.2)}});
  if(!raw.result?.partition)return {events:[],result:null,status:'infeasible',errors:raw.metadata?.errors||['No legal sweep cut']};
  const r=raw.result, ids=g.nodes.map(n=>n.id), a=Object.fromEntries(ids.map(id=>[id,r.partition[0].includes(id)?0:1]));
  const events=[event('laplacian',a,{matrix:r.L,ids}),event('eigen',a,{values:r.eigenvalues,order:r.order,vector:r.fiedler,diagnostics:r.diagnostics})];
  r.sweep.forEach(s=>events.push(event('sweep',Object.fromEntries(ids.map(id=>[id,s.left.includes(id)?0:1])),{candidates:r.sweep,position:s.k,legal:s.legal})));
  events.push(event('choose',a,{chosen:r.bestK,order:r.order,diagnostics:r.diagnostics}));
  return {events,result:{...r,assignment:a},status:raw.status};
}

function recursiveRun(g,{k=3,minFraction=0.2}={}) {
  const ids=g.nodes.map(n=>n.id).sort(), a=Object.fromEntries(ids.map(id=>[id,0]));
  const events=[event('start',a)], tree=[];
  for(let next=1;next<k;next++) {
    const groups=Array.from({length:next},(_,label)=>({label,members:ids.filter(id=>a[id]===label)})).sort((x,y)=>y.members.length-x.members.length||x.label-y.label);
    const selected=groups[0],set=new Set(selected.members);
    const sub={nodes:g.nodes.filter(n=>set.has(n.id)),edges:g.edges.filter(e=>set.has(e.u)&&set.has(e.v))};
    const r=spectralRun(sub,{minFraction});
    if(!r.result)return {events,result:{assignment:a,tree,cut:cutsize(g,a)},status:'infeasible',errors:['A recursive split has no legal prefix']};
    const before=cutsize(g,a), right=selected.members.filter(id=>r.result.assignment[id]===1);
    right.forEach(id=>a[id]=next);
    const split={source:selected.label,newLabel:next,members:selected.members,children:[selected.members.filter(id=>a[id]===selected.label),right],order:r.result.order,addedCut:cutsize(g,a)-before};
    tree.push(split);events.push(event('split',a,{...split,tree:clone(tree)}));
  }
  return {events,result:{assignment:a,tree,cut:cutsize(g,a)},status:'completed'};
}

function multiwayRun(g,{k=3,capacity=null,strategy='recursive-swap',minFraction=0.2}={}) {
  if(!['round-robin','recursive','recursive-swap'].includes(strategy))throw Error('Unknown k-way strategy');
  const base=strategy==='round-robin'?{events:[],result:{assignment:Object.fromEntries(g.nodes.map((n,i)=>[n.id,i%k]))},status:'completed'}:recursiveRun(g,{k,minFraction});
  const a={...base.result.assignment},events=[...base.events,event('initial-kway',a)];
  if(base.status!=='completed'||!metrics(g,a,k,capacity).feasible)return {events,result:{assignment:a,cut:cutsize(g,a)},status:'infeasible',errors:['Initial grouping violates nonempty groups or area capacity; no repair is silently applied.']};
  if(strategy==='recursive-swap') {
    let stable=false;
    for(let step=0;step<80;step++) {
      const candidates=[],before=cutsize(g,a),ids=g.nodes.map(n=>n.id).sort();
      for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++) {
        const u=ids[i],v=ids[j];if(a[u]===a[v])continue;
        const t={...a,[u]:a[v],[v]:a[u]};if(metrics(g,t,k,capacity).feasible)candidates.push({a:u,b:v,gain:before-cutsize(g,t),assignment:t});
      }
      candidates.sort((x,y)=>compareKeys([-x.gain,x.a,x.b],[-y.gain,y.a,y.b]));
      const best=candidates[0];
      if(!best||best.gain<=1e-9){events.push(event('local-stop',a,{candidates}));stable=true;break;}
      Object.assign(a,best.assignment);events.push(event('swap',a,{chosen:[best.a,best.b],gain:best.gain,candidates}));
    }
    if(!stable)return {events,result:{assignment:a,cut:cutsize(g,a)},status:'limit'};
  }
  return {events,result:{assignment:a,cut:cutsize(g,a)},status:'completed'};
}

export function exact(input,{k=2,capacity=null,maxDiff=null}={}) {
  const g=requireGraph(input,{maxNodes:9}),ids=g.nodes.map(n=>n.id).sort();
  if(!Number.isInteger(k)||k<2||k>Math.min(4,ids.length))throw Error('Exact oracle supports 2–4 groups and at most 9 nodes');
  let best=null,checked=0;const a={};
  function search(i,used){
    if(i===ids.length){if(used!==k)return;const m=metrics(g,a,k,capacity);if(!m.feasible||(maxDiff!==null&&Math.max(...m.counts)-Math.min(...m.counts)>maxDiff))return;checked++;if(!best||m.cut<best.cut)best={assignment:{...a},...m};return;}
    for(let p=0;p<Math.min(k,used+1);p++){a[ids[i]]=p;search(i+1,Math.max(used,p+1));}
  }
  search(0,0);return {best,checked};
}

export function run(method,input=G01,params={}) {
  try {
    if(!METHODS.includes(method))throw Error('Unknown method');
    const g=requireGraph(input,{maxNodes:12,maxEdges:66}), n=g.nodes.length;
    if(input.nets?.length)throw Error('This interface accepts ordinary edges; hypergraph nets are not supported here');
    if(g.nodes.some(n=>Object.prototype.hasOwnProperty.call(Object.prototype,n.id)))throw Error('Reserved object names cannot be used as vertex IDs');
    if(n<2)throw Error('At least two nodes are required');
    const k=['recursive','multiway'].includes(method)?(params.k??3):2;
    if(!Number.isInteger(k)||k<2||k>Math.min(6,n))throw Error('k must be an integer between 2 and min(6,n)');
    const minFraction=params.minFraction??0.2;
    if(!Number.isFinite(minFraction)||minFraction<0||minFraction>0.5)throw Error('Minimum fraction must be between 0 and 0.5');
    const capacity=params.capacity??null;
    if(capacity!==null&&(!Number.isFinite(capacity)||capacity<=0))throw Error('Capacity must be positive');
    const maxPasses=params.maxPasses??10;
    if(params.seed!==undefined&&(!Number.isInteger(params.seed)||Math.abs(params.seed)>2147483647))throw Error('Seed must be a 32-bit integer');
    if(!Number.isInteger(maxPasses)||maxPasses<1||maxPasses>30)throw Error('Pass limit must be 1–30');
    const initial=params.initial??(g.nodes.every(n=>Object.hasOwn(BAD,n.id))&&n===5?BAD:Object.fromEntries(g.nodes.map((x,i)=>[x.id,i<Math.floor(n/2)?0:1])));
    let raw;
    if(method==='metrics'){metrics(g,initial);raw={events:[event('evaluate',initial)],result:{assignment:{...initial}},status:'completed'};}
    else if(method==='initial')raw=initialRun(g,params);
    else if(method==='spectral')raw=spectralRun(g,{...params,minFraction});
    else if(method==='recursive')raw=recursiveRun(g,{...params,k,minFraction});
    else if(method==='multiway')raw=multiwayRun(g,{...params,k,capacity,minFraction});
    else {
      metrics(g,initial);
      raw=method==='kl'?KL.run(g,{initial,maxPasses}):FM.run(g,{initial,maxPasses,maxDiff:params.maxDiff??1});
      if(raw.status==='invalid')return {...raw,errors:raw.metadata.errors};
      raw.events=raw.events.map(e=>({...e,assignment:e.after}));
    }
    raw.events=raw.events.map((e,i)=>({...e,index:i,metrics:{...e.metrics,...metrics(g,e.assignment,k,capacity)}}));
    if(raw.result?.assignment)raw.result={...raw.result,metrics:metrics(g,raw.result.assignment,k,capacity)};
    return {...raw,graph:g,k,method};
  } catch(e) {return {events:[],result:null,status:'invalid',errors:e.errors||[e.message]};}
}
