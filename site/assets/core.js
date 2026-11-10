import {readState,saveState,validateState,download,STORAGE_KEY} from './state.js';
import {t,root,moduleURL,notice} from './ui.js';
import {mountCourseSearch} from './course-search.js';
window.addEventListener('storage-error',()=>notice(t('浏览器无法保存或读取学习记录。你仍可学习，并可在学习记录页导出当前会话。','This browser cannot store or read progress. You can still learn and export this session from Progress.')));
const course=await fetch(root+'data/course.json').then(r=>{if(!r.ok)throw Error('Course data could not be loaded');return r.json();});
mountCourseSearch(course);
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
document.querySelectorAll('[data-lang-link]').forEach(a=>a.addEventListener('click',()=>{a.href+=location.hash;}));
const observers=document.querySelectorAll('.lesson-prose h2');
if('IntersectionObserver'in window&&observers.length){
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)document.querySelectorAll('.reading-toc a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-12% 0px -70% 0px'});observers.forEach(h=>io.observe(h));
}
if(document.body.dataset.page==='progress'){
 const {progressMarkup}=await import('./progress-review.js');
 const target=document.querySelector('#progress-list');
 function render(){
  const active=document.activeElement,lessonId=active.closest('[data-progress-lesson]')?.dataset.progressLesson;
  const href=active.tagName==='A'?active.getAttribute('href'):null,wasSummary=active.tagName==='SUMMARY';
  const expanded=new Set([...target.querySelectorAll('.progress-questions[open]')].map(el=>el.closest('[data-progress-lesson]').dataset.progressLesson));
  target.innerHTML=progressMarkup(course,readState());
  for(const details of target.querySelectorAll('details.progress-questions'))details.open=expanded.has(details.closest('[data-progress-lesson]').dataset.progressLesson);
  if(lessonId){
   const row=target.querySelector(`[data-progress-lesson="${lessonId}"]`);
   const same=href?[...row.querySelectorAll('a')].find(a=>a.getAttribute('href')===href):wasSummary?row.querySelector('summary'):null;
   (same||row.querySelector('[data-progress-next]'))?.focus({preventScroll:true});
  }
 }
 render();window.addEventListener('progress-changed',render);
 // Back/forward cache and another tab can preserve an older in-memory record.
 function refreshProgress(){readState(true);render();}
 window.addEventListener('pageshow',event=>{if(event.persisted)refreshProgress();});
 window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===null)refreshProgress();});
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
