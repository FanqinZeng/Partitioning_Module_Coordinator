import {t,esc,fmt,root,table} from './ui.js';
import {readState,updateLesson,download} from './state.js';
import {graphSVG} from './graph.js';
import {G01,run} from '../engines/course.js';
export async function mountCodeLab(host,module){
 const labs=await fetch(root+'data/python-labs.json').then(r=>r.json()),lab=labs[module.id];
 let worker=null,timeout=null,saving=null;
 host.innerHTML=`<div class="code-intro"><h3>${t('写两个函数，解释一个结果','Write two functions, explain one result')}</h3><p>${t('Python 在独立 worker 中运行，首次载入约 12 MB 本地运行时。检查包含 120 个带种子的随机案例。TODO 会显示“未完成”。','Python runs in a dedicated worker, initially loading about 12 MB of local runtime files. Checks include 120 seeded cases. TODOs are reported as incomplete.')}</p></div><div class="code-grid"><div><label for="python-editor">${t('你的 Python 代码（自动保存草稿）','Your Python code (draft saved locally)')}</label><textarea id="python-editor" class="python-editor" spellcheck="false" autocapitalize="off" autocomplete="off" rows="22"></textarea><div class="btn-row"><button class="btn primary" data-check>${t('运行检查','Run checks')}</button><button class="btn quiet" data-stop disabled>${t('停止执行','Stop')}</button><button class="btn quiet" data-download-code>${t('下载我的代码','Download my code')}</button></div><details class="reference-source"><summary>${t('参考解（打开不会覆盖你的代码）','Reference solution (does not overwrite your code)')}</summary><pre><code>${esc(lab.reference)}</code></pre><button class="btn quiet" data-use-reference>${t('复制参考解到编辑器','Copy reference into editor')}</button></details><button class="text-button" data-restore>${t('恢复起始模板','Restore starter')}</button></div><div><p data-python-status class="python-status" role="status">${t('等待运行。','Ready when you are.')}</p><div data-check-results></div><pre data-stdout hidden></pre><div data-student-visual></div></div></div>`;
 const $=s=>host.querySelector(s),editor=$('#python-editor'),status=$('[data-python-status]');
 editor.maxLength=100000;
 editor.value=readState().modules[module.id]?.draft||lab.starter;
 function saveDraft(){updateLesson(module.id,p=>{p.draft=editor.value;p.code=false;});}
 editor.addEventListener('input',()=>{clearTimeout(saving);saving=setTimeout(saveDraft,300);});
 editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const start=editor.selectionStart,end=editor.selectionEnd;editor.setRangeText('    ',start,end,'end');editor.dispatchEvent(new Event('input'));}});
 function finish(){clearTimeout(timeout);$('[data-check]').disabled=false;$('[data-stop]').disabled=true;}
 function stop(){worker?.terminate();worker=null;finish();status.textContent=t('执行已停止；代码草稿保留。','Execution stopped; your draft is preserved.');}
 $('[data-stop]').onclick=stop;
 $('[data-check]').onclick=()=>{
  if(worker)worker.terminate();clearTimeout(saving);saveDraft();
  $('[data-check-results]').innerHTML='';$('[data-student-visual]').innerHTML='';$('[data-stdout]').textContent='';$('[data-stdout]').hidden=true;
  $('[data-check]').disabled=true;$('[data-stop]').disabled=false;status.textContent=t('正在启动本地 Python…','Starting local Python…');
  worker=new Worker(new URL('./py-worker.js',import.meta.url),{type:'module'});
  timeout=setTimeout(()=>{stop();status.textContent=t('运行超过 45 秒，已停止。检查是否有无限循环，再运行。','Stopped after 45 seconds. Check for an infinite loop, then retry.');},45000);
  worker.onmessage=({data})=>{
   if(data.type==='stdout'){const out=$('[data-stdout]');out.hidden=false;if(out.textContent.length<20000)out.textContent+=data.text+'\n';}
   if(data.type==='status')status.textContent=data.message==='loading'?t('正在加载自托管 Python 运行时…','Loading the self-hosted Python runtime…'):t('正在执行你的函数与检查…','Running your functions and checks…');
   if(data.type==='error'){finish();status.textContent=t('运行错误：','Execution error: ')+data.message;worker.terminate();worker=null;}
   if(data.type==='result'){
    finish();const r=data.result;
    status.textContent=r.passed?t('全部通过。下方显示你的函数输出。','All checks passed. Your function output appears below.'):r.incomplete?t('未完成：请替换 TODO 后再运行。','Incomplete: replace the TODOs and run again.'):t('有检查未通过，请根据反馈修改。','Some checks failed. Use the feedback to revise.');
    $('[data-check-results]').innerHTML=r.checks.map(c=>`<div class="check-row ${c.passed?'pass':'fail'}"><span>${c.passed?'✓':'×'}</span><div><strong>${esc(c.name)}</strong>${c.message?`<p>${esc(c.message)}</p>`:''}</div></div>`).join('');
    if(r.passed)updateLesson(module.id,p=>p.code=true);
    const v=r.visualization;
    if(v){
     const target=$('[data-student-visual]');let visual='';
     if(module.id==='07'&&v.studentSubgraph){const sub=v.studentSubgraph;const valid=Array.isArray(sub.nodes)&&Array.isArray(sub.edges)&&sub.nodes.every(n=>typeof n==='string');if(valid)visual=graphSVG(sub,Object.fromEntries(sub.nodes.map(n=>[n,0])),{dark:false,label:t('你的函数返回的诱导子图','Induced subgraph returned by your functions')});}
     else if(v.assignment){const k=module.id==='08'?3:2,valid=run('metrics',G01,{initial:v.assignment});if((k===2&&valid.status!=='invalid')||(k===3&&G01.nodes.every(n=>Number.isInteger(v.assignment[n.id])&&v.assignment[n.id]>=0&&v.assignment[n.id]<3)))visual=graphSVG(G01,v.assignment,{dark:false});}
     const rows=Object.entries(v).filter(([key])=>key!=='assignment'&&key!=='studentSubgraph').map(([key,value])=>[key,typeof value==='object'?JSON.stringify(value):fmt(value)]);
     target.innerHTML=`<h4>${t('你的函数输出','Your function output')}</h4>${visual}${rows.length?table([t('输出','Output'),t('值','Value')],rows):''}<p class="small muted">${t('图和输出使用本次运行的学生函数；未通过的结果仅供诊断。','The visualization uses your functions from this run; failing results are diagnostic only.')}</p>`;
    }
    worker.terminate();worker=null;
   }
  };
  worker.onerror=e=>{finish();status.textContent=t('Worker 错误：','Worker error: ')+e.message;worker?.terminate();worker=null;};
  worker.postMessage({lesson:module.id,source:editor.value});
 };
 $('[data-download-code]').onclick=()=>download(`lesson-${module.id}-my-code.py`,editor.value,'text/x-python');
 $('[data-use-reference]').onclick=()=>{editor.value=lab.reference;saveDraft();status.textContent=t('参考解已放入编辑器。你可以修改并运行。','Reference copied into editor. You can modify it and run.');};
 $('[data-restore]').onclick=()=>{editor.value=lab.starter;saveDraft();status.textContent=t('已恢复起始模板。','Starter restored.');};
 window.addEventListener('pagehide',()=>{clearTimeout(saving);if(editor.value!==readState().modules[module.id]?.draft)saveDraft();worker?.terminate();});
}
