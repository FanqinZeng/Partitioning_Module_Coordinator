import './core.js';
import {readState} from './state.js';
import {matchesCourse,matchesLesson,summarizeCourse} from './catalog-model.js';
import {t,esc,root,languageRoot,EN} from './ui.js';
const response=await fetch(root+'data/courses.json');
if(!response.ok)throw Error('Course registry could not be loaded');
const courses=await response.json(),form=document.querySelector('[data-catalog-filters]');
const link=path=>path.startsWith('https://')?path:languageRoot+path;
function draw(){
 const filters=Object.fromEntries(new FormData(form));const visible=courses.filter(c=>matchesCourse(c,filters));
 document.querySelectorAll('[data-directory-course]').forEach(card=>card.hidden=!visible.some(c=>c.id===card.dataset.directoryCourse));
 document.querySelector('[data-catalog-result]').textContent=t(`显示 ${visible.length} / ${courses.length} 门课程`,`Showing ${visible.length} of ${courses.length} courses`);
 document.querySelector('[data-catalog-empty]').hidden=visible.length>0;
 const query=String(filters.q||'').trim().toLowerCase(),host=document.querySelector('[data-lesson-results]');
 const hits=query?visible.flatMap(c=>(c.outline||[]).filter(unit=>matchesLesson(unit,query)).map(unit=>({c,unit}))):[];
 host.hidden=hits.length===0;
 host.innerHTML=hits.length?`<h3>${t('相关课时','Matching lessons')}</h3><div>${hits.slice(0,12).map(({c,unit})=>`<a href="${esc(link(unit.entry[EN?1:0]))}"><small>${esc(c.title)}</small><span>${esc(t(unit.title))} ${c.external?'↗':'→'}</span></a>`).join('')}</div>`:'';
}
form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',draw);form.addEventListener('change',draw);
form.addEventListener('reset',()=>queueMicrotask(draw));document.querySelector('[data-clear-filters]').addEventListener('click',()=>form.reset());
function progress(){
 const state=readState(),resume=document.querySelector('[data-catalog-resume]');resume.hidden=true;
 for(const c of courses){const summary=summarizeCourse(c,state);if(!summary)continue;
  const label=t(`已完成 ${summary.done}/${summary.total} 项 · ${summary.lessons}/${c.units} 章`,`Completed ${summary.done}/${summary.total} activities · ${summary.lessons}/${c.units} lessons`);
  const target=document.querySelector(`[data-catalog-progress="${c.id}"]`);
  if(target)target.innerHTML=`<div><span>${esc(label)}</span><strong>${summary.percent}%</strong></div><progress value="${summary.done}" max="${summary.total}" aria-label="${esc(c.title+' '+t('学习进度','progress'))}"></progress>`;
  const map=document.querySelector(`[data-map-progress="${c.id}"]`);if(map)map.textContent=label;
  const node=document.querySelector(`[data-path-course="${c.id}"]`);if(node)node.dataset.progress=summary.percent===100?'complete':summary.done?'started':'new';
  if(summary.last){const unit=c.outline.find(x=>x.id===summary.last);if(!unit)continue;
   const destination=link(unit.entry[EN?1:0]);resume.innerHTML=`<div><small>${t('继续上次的学习','PICK UP WHERE YOU LEFT OFF')}</small><strong>${esc(c.title)} · ${esc(t(unit.title))}</strong><span>${esc(label)}</span></div><a class="btn primary" href="${esc(destination)}">${t('继续学习','Continue learning')} →</a>`;resume.hidden=false;
   const cta=document.querySelector(`[data-course-cta="${c.id}"]`);if(cta){cta.href=destination;cta.textContent=t('继续学习 →','Continue learning →');}
  }
 }
}
progress();draw();window.addEventListener('progress-changed',progress);
