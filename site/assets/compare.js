import './core.js';
import {run,G01,exact,clone} from '../engines/course.js';
import {graphSVG} from './graph.js';
import {t,fmt,esc} from './ui.js';
import {prepareComparison, comparisonFragment, readComparisonFragment} from './compare-snapshot.js';
const host=document.querySelector('.compare-page'),$=s=>host.querySelector(s),editor=$('#compare-json');
const groupCount=$('[name=k]'),capacityField=$('[name=capacity]');
const shareField=$('[data-comparison-link]'),shareStatus=$('[data-comparison-status]');
let current=clone(G01),outputs=[],applied;
editor.value=JSON.stringify(current,null,2);
const error=$('.compare-error');
const grouping=a=>{const groups={};for(const[id,p]of Object.entries(a||{}))(groups[p]||=[]).push(id);return Object.values(groups).map(a=>a.sort().join(',')).join(' | ');};
function draw(snapshot){
 try{
  const {graph,k,capacity}=snapshot ?? prepareComparison(
   JSON.parse(editor.value),
   Number(groupCount.value),
   capacityField.value===''?null:Number(capacityField.value),
  );
  current=graph;outputs=[];error.hidden=true;
  const fraction=Math.floor(graph.nodes.length/2)/graph.nodes.length;
  const two=[
   [t('区域生长','Region growing'),'initial',{strategy:'grow'},t('固定 floor/ceil 人数','Fixed floor/ceil counts')],
   [t('顺序贪心','Sequential greedy'),'initial',{strategy:'greedy'},t('固定 floor/ceil 人数','Fixed floor/ceil counts')],
   [t('随机 seed=7','Random seed=7'),'initial',{strategy:'random',seed:7},t('固定 floor/ceil 人数','Fixed floor/ceil counts')],
   ['KL','kl',{},t('保持初始 floor/ceil 人数','Preserve initial floor/ceil counts')],
   ['FM','fm',{maxDiff:1},t('人数差 ≤1','Count difference ≤1')],
   [t('谱扫描','Spectral sweep'),'spectral',{minFraction:fraction},t('精确 floor/ceil 人数窗口','Exact floor/ceil count window')]
  ];
  const many=[
   [t('轮转','Round robin'),'multiway',{k,capacity,strategy:'round-robin'},t('输入顺序；检查最终容量','Input order; check final capacity')],
   [t('递归','Recursive'),'multiway',{k,capacity,strategy:'recursive'},t('局部 20% 窗口；检查最终容量','Local 20% window; check final capacity')],
   [t('递归 + 交换','Recursive + swaps'),'multiway',{k,capacity,strategy:'recursive-swap'},t('只接受合法正增益交换','Only legal improving swaps')]
  ];
  function render(specs,target){
   const rows=specs.map(([label,method,params,contract])=>{
    const r=run(method,current,params),i=outputs.length;outputs.push({label,r});
    const m=r.result?.metrics,feasible=r.status==='completed'&&m?.feasible;
    return `<tr><td><button class="text-button" data-result="${i}">${esc(label)} ↘</button></td><td>${esc(contract)}</td><td>${esc(grouping(r.result?.assignment)||'—')}</td><td>${fmt(m?.cut)}</td><td>${m?.areas.map(fmt).join(' / ')||'—'}</td><td>${feasible?t('合法','Feasible'):esc(r.status)}</td></tr>`;
   });
   target.innerHTML=`<div class="table-scroll"><table><thead><tr>${[t('方法 / 查看结果','Method / inspect'),t('契约','Contract'),t('分组','Grouping'),'cut',t('面积','Areas'),t('状态','Status')].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }
  render(two,$('[data-bisection-table]'));render(many,$('[data-kway-table]'));
  if(graph.nodes.length<=9&&k<=4){
   const b=exact(current,{k:2,maxDiff:1}),m=exact(current,{k,capacity});
   $('[data-oracle]').textContent=t('精确对照：二分人数差 ≤1 的最优 cut 为 ','Exact reference: bisection with count difference ≤1 has optimum ')+fmt(b.best?.cut)+t('；k 路在当前容量下的最优 cut 为 ','; k-way optimum under the current capacity is ')+(m.best?fmt(m.best.cut):t('无可行解','infeasible'))+t('。只校准此输入；不构成启发式的一般保证。',' . This calibrates this input only, not a general heuristic guarantee.');
  }else $('[data-oracle]').textContent=t('精确对照已跳过：最多支持 9 节点与 4 组。','Exact reference skipped: limited to 9 vertices and 4 parts.');
  host.querySelector('.compare-trace')?.remove();
  applied={graph,k,capacity};
  shareField.hidden=true;
  shareStatus.textContent='';
 }catch(e){error.hidden=false;error.textContent=t('保留上次有效比较。输入错误：','Previous valid comparison preserved. Input error: ')+e.message;}
}
$('[data-compare]').onclick=()=>draw();
$('[data-change-weight]').onclick=()=>{const g=clone(G01);g.edges.find(e=>e.u==='A'&&e.v==='B').w=1;editor.value=JSON.stringify(g,null,2);draw();};
$('[data-reset-graph]').onclick=()=>{editor.value=JSON.stringify(G01,null,2);draw();};
host.addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(!b)return;const {label,r}=outputs[Number(b.dataset.result)];host.querySelector('.compare-trace')?.remove();const pane=document.createElement('section');pane.className='compare-trace';pane.innerHTML=`<h3>${esc(label)}</h3>${r.result?.assignment?graphSVG(current,r.result.assignment,{dark:false}):''}<p class="compare-note">${t('运行状态','Run status')}: ${esc(r.status)} · ${r.events.length} ${t('个事件','events')}${r.errors?' · '+esc(r.errors.join(' ')):''}</p>`;host.append(pane);pane.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});

$('[data-share-comparison]').onclick=async()=>{
 if(!applied)return;
 const link=new URL(location.href);
 link.hash=comparisonFragment(applied);
 shareField.value=link.href;
 shareField.hidden=false;
 try{
  await navigator.clipboard.writeText(link.href);
  shareStatus.textContent=t('已复制比较链接。','Comparison link copied.');
 }catch{
  shareField.focus();
  shareField.select();
  shareStatus.textContent=t('请复制已选中的链接。','Copy the selected link.');
 }
};

function restoreComparison(){
 try{
  const snapshot=readComparisonFragment(location.hash);
  if(!snapshot)return;
  editor.value=JSON.stringify(snapshot.graph,null,2);
  groupCount.value=snapshot.k;
  capacityField.value=snapshot.capacity??'';
  draw(snapshot);
  shareStatus.textContent=t('已载入链接中的比较。','Comparison loaded from the link.');
 }catch{
  error.hidden=false;
  error.textContent=t('无法打开此比较链接，已保留当前结果。','This comparison link could not be opened. The current results are still shown.');
 }
}

draw();
restoreComparison();
window.addEventListener('hashchange',restoreComparison);
