import {run,G01,BAD,GOOD,metrics,clone} from '../engines/course.js';
import {graphSVG,graphButtons} from './graph.js';
import {t,esc,fmt,table} from './ui.js';
import {download,updateLesson} from './state.js';
const KINDS={evaluate:['评价当前分组','Evaluate assignment'],seed:['选择锚点','Select anchor'],shuffle:['有种子的洗牌','Seeded shuffle'],grow:['吸收最高分节点','Grow by connection score'],place:['按增量放置','Place by incremental cut'],'pass-start':['开始一轮，解除锁定','Begin a pass and unlock'],'trial-swap':['试探交换并锁定','Trial swap and lock'],'trial-move':['试探移动并锁定','Trial move and lock'],'best-prefix':['选择最佳前缀，执行回退','Accept best prefix and roll back'],laplacian:['构造 L = D − A','Build L = D − A'],eigen:['求解并检查特征向量','Solve and check eigenvector'],sweep:['扫描当前前缀','Sweep current prefix'],choose:['选择最佳合法切口','Choose best legal threshold'],start:['从一个组开始','Start with one part'],split:['在诱导子图上重新二分','Bisect the induced subgraph'],'initial-kway':['检查 k 路构造结果','Check the k-way construction'],swap:['接受正增益交换','Accept an improving swap'],'local-stop':['没有合法正增益交换','No improving legal swap']};
const PSEUDO={
 metrics:[['检查完整分组与输入','validate graph and complete assignment'],['逐边判断异组并累加','sum weights of crossing edges'],['报告人数、面积与可行性','report counts, areas and feasibility']],
 initial:[['选择策略、目标人数与锚点','choose strategy, target counts and anchor'],['计算候选分数 / 增量','score candidates / increments'],['按规则分配并继续','place by the declared rule and repeat'],['达到目标，返回分组','return the completed assignment']],
 kl:[['复制起点，解除所有锁定','copy pass start; unlock all vertices'],['计算 D 与未锁定跨侧点对增益','compute D and unlocked cross-pair gains'],['试探交换最高增益点对并锁定','try highest-gain pair and lock both'],['选择最大累计增益的最早前缀','select earliest maximum cumulative prefix'],['从起点接受此前缀；空前缀则停止','accept prefix from start; stop if empty']],
 fm:[['复制起点，解除所有锁定','copy pass start; unlock all vertices'],['筛选移动后合法的未锁定节点','filter unlocked post-move legal vertices'],['试探最大增益移动，锁定并更新','try highest gain; lock and update'],['选择最大累计增益的最早前缀','select earliest maximum cumulative prefix'],['从起点接受此前缀；空前缀则停止','accept prefix from start; stop if empty']],
 spectral:[['逐边构造 L = D − A','build L = D − A from edges'],['求第二特征向量并检查残差','solve second vector; check residual'],['按坐标排序，扫描各个前缀','sort coordinates and sweep prefixes'],['过滤人数窗口，选最低 cut','filter count window and minimize cut']],
 recursive:[['所有节点先归入一个组','start with all vertices in one part'],['选择人数最多的当前组','select the largest current part'],['在诱导子图上重新进行谱二分','solve spectral bisection on its induced subgraph'],['记录新边界；重复直到 k 组','record new boundary; repeat until k parts']],
 multiway:[['按所选策略构造 k 个组','construct k parts using selected strategy'],['检查非空与面积容量','check nonempty parts and area capacities'],['枚举合法跨组交换，选最大正增益','enumerate legal swaps; select best positive gain'],['接受并重复，无改进则停止','accept and repeat; stop if none improves']]
};
function activeLine(method,kind){
 const map={metrics:{evaluate:1},initial:{seed:0,shuffle:0,grow:2,place:2},kl:{'pass-start':0,'trial-swap':2,'best-prefix':3},fm:{'pass-start':0,'trial-move':2,'best-prefix':3},spectral:{laplacian:0,eigen:1,sweep:2,choose:3},recursive:{start:0,split:2},multiway:{start:0,split:0,'initial-kway':1,swap:2,'local-stop':3}};
 return map[method]?.[kind]??0;
}
export function eventExplanation(e){
 const m=e.metrics;
 if(e.kind==='trial-swap'||e.kind==='trial-move'){
  const changed=Object.keys(e.assignment).filter(id=>e.before?.[id]!==e.assignment[id]);
  return t(`试探 ${changed.join(' ↔ ')}，增益 ${fmt(e.trialGain)}：cut ${fmt(m.cutBefore)} → ${fmt(m.cut)}。这一步尚未最终接受。`,`Trial ${changed.join(' ↔ ')} gains ${fmt(e.trialGain)}: cut ${fmt(m.cutBefore)} → ${fmt(m.cut)}. This trial is not yet accepted.`);
 }
 if(e.kind==='best-prefix')return t(`保留 ${e.prefix.bestK} 步，前缀累计增益 [${e.prefix.gains.map(fmt).join(', ')}]；恢复后的 cut 为 ${fmt(m.cut)}。`,`Retain ${e.prefix.bestK} trials from prefix gains [${e.prefix.gains.map(fmt).join(', ')}]; restored cut is ${fmt(m.cut)}.`);
 if(e.kind==='split')return t(`拆分 ${e.members.join('')} → ${e.children.map(x=>x.join('')).join(' | ')}，全图新增 cut ${fmt(e.addedCut)}。`,`Split ${e.members.join('')} → ${e.children.map(x=>x.join('')).join(' | ')}; full-graph cut increases by ${fmt(e.addedCut)}.`);
 if(e.kind==='sweep')return t(`尝试前 ${e.position} 个节点，cut ${fmt(m.cut)}，${e.legal?'满足':'不满足'}人数窗口。`,`Try prefix ${e.position}: cut ${fmt(m.cut)}, ${e.legal?'inside':'outside'} the count window.`);
 if(e.kind==='local-stop')return t('当前合法交换中没有严格正增益；这只是交换邻域内停止。','No legal swap has strictly positive gain. This is a stop within the swap neighborhood.');
 if(e.kind==='evaluate')return t('点击节点可换侧。先判断分组是否合法，再比较跨边权重之和。','Click a vertex to move it. Check feasibility before comparing the crossing-weight sum.');
 if(e.kind==='grow')return t(`选择 ${e.chosen}，其与当前区域的连接总分最高；平票按名字。`,`Select ${e.chosen} with highest connection score to the current region; ties use names.`);
 if(e.kind==='place')return t(`放置 ${e.node} 到组 ${e.chosen}；候选增量只计已分配节点。`,`Place ${e.node} in part ${e.chosen}; candidate increments count placed vertices only.`);
 return t(KINDS[e.kind]||[e.kind,e.kind]);
}
function details(e,g){
 let html='';
 if(e.candidates?.length){
  const c=e.candidates[0];let fields;
  if('Da'in c)fields=[['a','a'],['b','b'],['Da','D(a)'],['Db','D(b)'],['w','w(a,b)'],['gain',t('增益','Gain')]];
  else if('node'in c)fields=[['node',t('节点','Vertex')],['score',t('连接分数','Score')]];
  else if('increment'in c)fields=[['side',t('侧','Side')],['increment',t('新增 cut','Added cut')],['legal',t('合法','Legal')]];
  else if('gain'in c)fields=[['a','a'],['b','b'],['gain',t('增益','Gain')]];
  if(fields)html+=`<p class="small">${e.kind==='trial-swap'?t('本次选择前的候选','Candidates before this choice'):t('本状态的候选','Candidates for this state')}</p>`+table(fields.map(f=>f[1]),e.candidates.map(c=>fields.map(f=>typeof c[f[0]]==='boolean'?(c[f[0]]?'✓':'×'):fmt(c[f[0]]))));
 }
 if(e.gains)html+=`<p class="small">${t('当前状态中，供下一步选择的单点候选','Single-node candidates for the next choice in this state')}</p>`+table([t('节点','Vertex'),t('侧','Side'),t('增益','Gain'),t('合法且未锁','Legal & unlocked'),t('锁定','Locked')],e.gains.map(c=>[c.node,c.side,fmt(c.gain),c.legal?'✓':'×',c.locked?'✓':'—']));
 if(e.matrix)html+=table(['L',...e.ids],e.matrix.map((r,i)=>[e.ids[i],...r.map(fmt)]));
 if(e.vector)html+=table([t('节点','Vertex'),'x'],g.nodes.map((n,i)=>[n.id,fmt(e.vector[i])]))+`<p>${t('特征值','Eigenvalues')}: ${e.values.map(fmt).join(', ')}</p>`;
 if(e.diagnostics){const d=e.diagnostics;html+=`<p class="small">λ₂ ${fmt(d.lambda2)} · residual ${fmt(d.residual)} · gap ${fmt(d.gap)}</p>`;if(d.warnings?.length)html+=`<p class="lab-warning">${esc(d.warnings.join(' '))}</p>`;}
 if(e.kind==='sweep')html+=table([t('前缀','Prefix'),t('左侧','Left'),t('cut','Cut'),t('合法','Legal')],e.candidates.map(s=>[s.k,s.left.join(''),s.cut,s.legal?'✓':'×']));
 if(e.tree)html+=table([t('父组','Parent'),t('子组','Children'),t('新增 cut','Added cut')],e.tree.map(s=>[s.members.join(''),s.children.map(c=>c.join('')).join(' | '),fmt(s.addedCut)]));
 if(e.order)html+=`<p>${t('顺序','Order')}: ${esc(e.order.join(' → '))}</p>`;
 if(e.prefix)html+=table([t('保留步数','Prefix length'),t('累计增益','Cumulative gain')],e.prefix.gains.map((gain,k)=>[k===e.prefix.bestK?k+' ✓':k,fmt(gain)]));
 if(!html)html=table([t('跨组边','Crossing edge'),t('权重','Weight')],e.metrics.cutEdges.map(e=>[e.u+'–'+e.v,fmt(e.w)]));
 return html;
}
export function mountLab(host,module,{inline=false}={}){
 const method=module.method;let graph=clone(G01),params={},result,index=0,timer=null;
 const controls=[];
 if(method==='initial')controls.push(`<label>${t('策略','Strategy')}<select name="strategy"><option value="grow">${t('区域生长','Region growing')}</option><option value="greedy">${t('顺序贪心','Sequential greedy')}</option><option value="random">${t('随机洗牌','Random shuffle')}</option></select></label><label>Seed<input name="seed" type="number" value="7" step="1"></label>`);
 if(['recursive','multiway'].includes(method))controls.push(`<label>k<input name="k" type="number" value="3" min="2" max="6"></label>`);
 if(method==='multiway')controls.push(`<label>${t('策略','Strategy')}<select name="strategy"><option value="recursive-swap">${t('递归 + 交换改进','Recursive + swaps')}</option><option value="recursive">${t('递归二分','Recursive')}</option><option value="round-robin">${t('轮转','Round robin')}</option></select></label><label>${t('面积容量（留空不限）','Area capacity (blank: none)')}<input name="capacity" type="number" min="0.1" step="0.1" placeholder="∞"></label>`);
 if(method==='fm')controls.push(`<label>maxDiff<input name="maxDiff" type="number" value="1" min="0" max="12"></label>`);
 if(['spectral','recursive','multiway'].includes(method))controls.push(`<label>${t('每侧最小人数比例','Minimum side count fraction')}<select name="minFraction"><option value="0.2">20%</option><option value="0.4">40%</option><option value="0.5">50%</option></select></label>`);
 host.classList.add('workbench');
 host.innerHTML=`${!inline?`<div class="workbench-toolbar">${controls.join('')}<button class="btn lab-btn" data-run>${t('重新运行','Run again')}</button></div>`:''}<div class="lab-error" role="alert" hidden></div><div class="workbench-main"><div class="graph-panel"><div data-graph></div><div class="metric-strip" data-metrics></div><p class="graph-caption">${t('虚线为跨组边 · 颜色与组号共同标识分组 · size 为节点面积','Dashed edges cross parts · colors and labels identify parts · size is vertex area')}</p></div><div class="decision-panel"><p class="eyebrow" data-step></p><h3 data-event-title></h3><p data-explain aria-live="polite"></p><p class="lock-line" data-locks></p><div data-details></div></div></div>${method!=='metrics'?`<div class="playback"><button class="btn lab-btn" data-first aria-label="${t('第一步','First step')}">|←</button><button class="btn lab-btn" data-prev aria-label="${t('上一步','Previous step')}">←</button><button class="btn lab-btn" data-play>${t('播放','Play')}</button><button class="btn lab-btn" data-next aria-label="${t('下一步','Next step')}">→</button><button class="btn lab-btn" data-last aria-label="${t('最后一步','Last step')}">→|</button><label class="timeline-label">${t('步骤','Step')}<input data-timeline type="range" min="0" value="0" max="1"></label><label>${t('间隔','Interval')}<select data-speed><option value="1600">1.6s</option><option value="800">0.8s</option><option value="3000">3s</option></select></label></div>`:`<div class="btn-row"><button class="btn lab-btn" data-bad>AE | BCD</button><button class="btn lab-btn" data-good>ABC | DE</button><label>${t('A 面积','A area')}<input data-area type="number" min="0.1" step="0.1" value="1"></label></div>`}${!inline?`<details class="lab-extra"><summary>${t('伪代码与事件记录','Pseudocode and event log')}</summary><ol class="pseudocode">${PSEUDO[method].map((l,i)=>`<li data-line="${i}">${esc(t(l))}</li>`).join('')}</ol><div class="event-list" data-log></div></details><details class="lab-extra"><summary>${t('自定义图与初始分组 / 导出','Custom graph, initial assignment / export')}</summary><p class="small">${t('2–12 个节点，正边权；initial 只用于评价、KL、FM。修改失败会保留上次有效实验。','Use 2–12 vertices and positive weights. Initial labels apply to metrics, KL and FM. Invalid edits preserve the previous valid run.')}</p><label>${t('图配置 JSON','Graph configuration JSON')}<textarea data-json spellcheck="false" rows="10"></textarea></label><div class="btn-row"><button class="btn lab-btn" data-apply>${t('校验并运行','Validate and run')}</button><button class="btn lab-btn" data-export>${t('导出配置与轨迹','Export configuration and trace')}</button><button class="btn lab-btn" data-reset>${t('恢复公共图','Reset to G01')}</button></div></details>`:''}`;
 const $=s=>host.querySelector(s),graphHost=$('[data-graph]'),error=$('.lab-error');
 function pause(){if(timer)clearInterval(timer);timer=null;if($('[data-play]'))$('[data-play]').textContent=t('播放','Play');}
 function readParams(){const next={...params};host.querySelectorAll('.workbench-toolbar [name]').forEach(el=>{next[el.name]=el.tagName==='SELECT'&&el.name==='strategy'?el.value:el.value===''?null:Number(el.value);});return next;}
 function showError(errors){error.textContent=t('输入未通过校验：','Input validation failed: ')+errors.join('; ');error.hidden=false;}
 function recompute(nextGraph=graph,nextParams=readParams()){
  pause();const next=run(method,nextGraph,nextParams);
  if(next.status==='invalid'||!next.events.length){showError(next.errors||['No legal trace']);return false;}
  graph=clone(next.graph||nextGraph);params=clone(nextParams);result=next;index=0;error.hidden=true;
  if($('[data-json]'))$('[data-json]').value=JSON.stringify({graph,params},null,2);
  if($('[data-log]')){$('[data-log]').innerHTML=result.events.map((e,i)=>`<button data-log-step="${i}" class="event-chip">${i+1} · ${esc(t(KINDS[e.kind]||[e.kind,e.kind]))}</button>`).join('');}
  draw();return true;
 }
 function draw(){
  const e=result.events[index],m=e.metrics,interactive=method==='metrics';
  graphHost.innerHTML=graphSVG(graph,e.assignment,{interactive,locks:e.locks||[]});
  $('[data-metrics]').innerHTML=`<span><small>cut</small><strong>${fmt(m.cut)}</strong></span><span><small>${t('人数','Counts')}</small><strong>${m.counts.join(' / ')}</strong></span><span><small>${t('面积','Areas')}</small><strong>${m.areas.map(fmt).join(' / ')}</strong></span><span><small>ratio</small><strong>${fmt(m.ratio)}</strong></span>`;
  $('[data-step]').textContent=`${t('事件','Event')} ${index+1} / ${result.events.length} · ${e.kind}`;
  $('[data-event-title]').textContent=t(KINDS[e.kind]||[e.kind,e.kind]);
  $('[data-explain]').textContent=eventExplanation(e);
  $('[data-locks]').textContent=e.locks?.length?t('锁定：','Locked: ')+e.locks.join(', '):'';
  $('[data-details]').innerHTML=details(e,graph);
  const feasibility=document.createElement('p');feasibility.className='lab-status';feasibility.textContent=m.feasible?t('当前分组：非空且满足所设面积容量。','Current grouping: nonempty and within the configured area capacity.'):!m.nonempty?t('当前分组有空组；构造中的状态不可作为最终可行解。','Current state has empty parts; a construction state is not a feasible final result.'):t('当前分组超过面积容量，不可行。','Current grouping exceeds area capacity and is infeasible.');$('[data-details]').prepend(feasibility);
  if(index===result.events.length-1){
   const note=document.createElement('p');note.className='lab-status';note.textContent=t('运行状态：','Run status: ')+result.status+(m.nonempty?'':t(' · 尚有空组',' · empty parts remain'))+(result.status==='infeasible'?' · '+(result.errors||[]).join(' '):'');$('[data-details]').append(note);
  }
  if($('[data-timeline]')){$('[data-timeline]').max=result.events.length-1;$('[data-timeline]').value=index;$('[data-prev]').disabled=$('[data-first]').disabled=index===0;$('[data-next]').disabled=$('[data-last]').disabled=index===result.events.length-1;}
  host.querySelectorAll('[data-line]').forEach(l=>l.classList.toggle('active',Number(l.dataset.line)===activeLine(method,e.kind)));
  host.querySelectorAll('[data-log-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.logStep)===index)));
 }
 function select(i,user=true){index=Math.max(0,Math.min(result.events.length-1,i));draw();if(user&&index===result.events.length-1&&result.status==='completed'&&result.events[index].metrics.feasible&&!inline)updateLesson(module.id,p=>p.lab=true);}
 $('[data-run]')?.addEventListener('click',()=>recompute());
 for(const [key,fn]of Object.entries({first:()=>0,prev:()=>index-1,next:()=>index+1,last:()=>result.events.length-1}))$('[data-'+key+']')?.addEventListener('click',()=>{pause();select(fn());});
 $('[data-timeline]')?.addEventListener('input',e=>{pause();select(Number(e.target.value));});
 $('[data-play]')?.addEventListener('click',()=>{if(timer){pause();return;}if(index===result.events.length-1)select(0,false);$('[data-play]').textContent=t('暂停','Pause');timer=setInterval(()=>{select(index+1);if(index===result.events.length-1)pause();},Number($('[data-speed]').value));});
 $('[data-speed]')?.addEventListener('change',pause);
 $('[data-log]')?.addEventListener('click',e=>{const b=e.target.closest('[data-log-step]');if(b){pause();select(Number(b.dataset.logStep));}});
 graphButtons(graphHost,id=>{if(method!=='metrics')return;const a={...result.events[index].assignment};a[id]=1-a[id];recompute(graph,{...params,initial:a});if(!inline&&result.events[index].metrics.feasible)updateLesson(module.id,p=>p.lab=true);});
 $('[data-bad]')?.addEventListener('click',()=>recompute(graph,{...params,initial:clone(BAD)}));
 $('[data-good]')?.addEventListener('click',()=>recompute(graph,{...params,initial:clone(GOOD)}));
 $('[data-area]')?.addEventListener('change',e=>{const g=clone(graph);g.nodes=g.nodes.map(n=>({...n,size:n.id==='A'?Number(e.target.value):n.size}));recompute(g,params);});
 $('[data-apply]')?.addEventListener('click',()=>{try{const conf=JSON.parse($('[data-json]').value);if(!conf.graph)throw Error('graph is required');if(recompute(conf.graph,conf.params||{})){host.querySelectorAll('.workbench-toolbar [name]').forEach(el=>{if(el.name in params)el.value=params[el.name]??'';});}}catch(e){showError([e.message]);}});
 $('[data-export]')?.addEventListener('click',()=>download(`lesson-${module.id}-trace.json`,JSON.stringify({version:1,method,graph,params,trace:result},null,2)));
 $('[data-reset]')?.addEventListener('click',()=>{params={};host.querySelectorAll('.workbench-toolbar [name]').forEach(el=>{if(el.tagName==='SELECT')el.selectedIndex=0;else el.value=el.name==='k'?3:el.name==='seed'?7:el.name==='maxDiff'?1:'';});recompute(clone(G01),readParams());});
 recompute();
 return {getResult:()=>result,select,pause};
}
