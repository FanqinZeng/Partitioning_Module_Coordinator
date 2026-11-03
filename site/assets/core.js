import {readState,saveState,validateState,download} from './state.js';
import {t,esc,root,languageRoot,moduleURL,notice} from './ui.js';
window.addEventListener('storage-error',()=>notice(t('浏览器无法保存或读取学习记录。你仍可学习，并可在学习记录页导出当前会话。','This browser cannot store or read progress. You can still learn and export this session from Progress.')));
const course=await fetch(root+'data/course.json').then(r=>{if(!r.ok)throw Error('Course data could not be loaded');return r.json();});
const search=document.querySelector('#search-dialog'),input=search?.querySelector('input'),results=search?.querySelector('[data-results]');
function showSearch(){search.showModal();input.focus();}
document.querySelector('[data-open-search]')?.addEventListener('click',showSearch);
search?.querySelector('[data-close]')?.addEventListener('click',()=>search.close());
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();if(!search.open)showSearch();}});
input?.addEventListener('input',()=>{
 const query=input.value.trim().toLowerCase();if(!query){results.innerHTML='';return;}
 const matches=[];
 for(const m of course){
  if((t(m.title)+' '+t(m.summary)+' '+m.terms.map(x=>x.join(' ')).join(' ')).toLowerCase().includes(query))matches.push({m,label:t(m.title),anchor:''});
  for(const section of m.sections){if((t(section.title)+' '+t(section.text)).toLowerCase().includes(query))matches.push({m,label:t(section.title),anchor:'#'+section.id});}
 }
 results.innerHTML=matches.slice(0,24).map(({m,label,anchor})=>`<a class="search-result" href="${moduleURL(m)}${anchor}"><small>Lesson ${m.id}</small><span>${esc(label)}</span></a>`).join('')||`<p>${t('没有结果。试试“增益”“容量”或 Fiedler。','No results. Try gain, capacity or Fiedler.')}</p>`;
});
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
document.querySelectorAll('[data-lang-link]').forEach(a=>a.addEventListener('click',()=>{a.href+=location.hash;}));
const observers=document.querySelectorAll('.lesson-prose h2');
if('IntersectionObserver'in window&&observers.length){
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('.reading-toc a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-12% 0px -70% 0px'});observers.forEach(h=>io.observe(h));
}
if(document.body.dataset.page==='progress'){
 const target=document.querySelector('#progress-list');
 function render(){const s=readState();target.innerHTML=course.map(m=>{const p=s.modules[m.id]||{},solved=Object.values(p.answers||{}).filter(Boolean).length;return `<article class="progress-row"><a href="${moduleURL(m)}"><small>Lesson ${m.id}</small><h3>${esc(t(m.title))}</h3></a><span>${t('阅读','Reading')} ${p.read?'✓':'—'}</span><span>${t('实验','Lab')} ${p.lab?'✓':'—'}</span><span>${t('挑战','Challenges')} ${solved}/7</span><span>Python ${p.code?'✓':'—'}</span></article>`;}).join('');}
 render();window.addEventListener('progress-changed',render);
 document.querySelector('[data-export]').onclick=()=>download('partitioning-progress.json',JSON.stringify(readState(),null,2));
 document.querySelector('[data-import]').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>1024*1024)throw Error('File too large');const incoming=validateState(JSON.parse(await file.text()));saveState(incoming);notice(t('已导入并替换本地学习记录。','Imported and replaced local progress.'));}catch(error){notice(t('导入失败，原记录保留：','Import failed; previous progress preserved: ')+error.message);}e.target.value='';};
 document.querySelector('[data-reset]').onclick=()=>document.querySelector('#reset-dialog').showModal();
 document.querySelector('[data-cancel-reset]').onclick=()=>document.querySelector('#reset-dialog').close();
 document.querySelector('[data-confirm-reset]').onclick=()=>{saveState({version:1,last:null,modules:{}});document.querySelector('#reset-dialog').close();};
}
if(['home','portal'].includes(document.body.dataset.page)){
 const s=readState(),m=course.find(m=>m.id===s.last);if(m){const a=document.querySelector('[data-continue]');a.href=moduleURL(m);a.textContent=t('继续学习：','Continue: ')+(document.body.dataset.page==='portal'?'Partitioning · ':'')+t(m.title);a.hidden=false;}
 for(const card of document.querySelectorAll('[data-progress-module]')){const m=s.modules[card.dataset.progressModule]||{},done=[m.read,m.lab,m.code].filter(Boolean).length+Object.values(m.answers||{}).filter(Boolean).length;card.querySelector('[data-progress-text]').textContent=done?t('已完成 ','Completed ')+done+'/10':'';card.querySelector('progress').value=done;}
}
export {course};
