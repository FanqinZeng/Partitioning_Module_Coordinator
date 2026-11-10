import {EN,t,esc,root,languageRoot,moduleURL} from './ui.js';
import {findFilmPassages,filmClock,matchesPassage} from './transcript-timeline.js';

function readingResults(course, query) {
 const matches=[];
 for(const lesson of course){
  const overview=[t(lesson.title),t(lesson.summary),...lesson.terms.flat()].join(' ');
  if(matchesPassage(overview,query))matches.push({lesson,label:t(lesson.title),anchor:''});
  for(const section of lesson.sections){
   if(matchesPassage(t(section.title)+' '+t(section.text),query)){
    matches.push({lesson,label:t(section.title),anchor:'#'+section.id});
   }
  }
 }
 return matches.slice(0,24).map(({lesson,label,anchor})=>
  `<a class="search-result" href="${moduleURL(lesson)}${anchor}"><small>Lesson ${lesson.id}</small><span>${esc(label)}</span></a>`).join('');
}

export function mountCourseSearch(course) {
 const dialog=document.querySelector('#search-dialog');
 const input=dialog.querySelector('input');
 const results=dialog.querySelector('[data-results]');
 const lessons=new Map(course.map(lesson=>[lesson.id,lesson]));
 const films=document.createElement('div');
 const readings=document.createElement('div');
 results.append(films,readings);
 let index;

 function showSearch(){
  if(!dialog.open)dialog.showModal();
  input.focus();
 }
 document.querySelector('[data-open-search]')?.addEventListener('click',showSearch);
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 document.addEventListener('keydown',event=>{
  if(event.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){
   event.preventDefault();
   showSearch();
  }
 });
 results.addEventListener('click',event=>{
  const link=event.target.closest('a');
  if(!link || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)return;
  dialog.close();
  // Selecting the same timestamp again should also return the player to that cue.
  if(link.href===location.href && link.hash.startsWith('#film-')){
   window.dispatchEvent(new Event('hashchange'));
  }
 });
 input.addEventListener('input',async ()=>{
  const query=input.value.trim();
  films.textContent='';
  readings.innerHTML=query ? readingResults(course,query) : '';
  if(!query)return;
  if(!index){
   index=fetch(root+'data/film-search.json').then(response=>{
    if(!response.ok)throw new Error('Film index unavailable');
    return response.json();
   }).catch(()=>null);
  }
  films.textContent=t('正在查找影片片段…','Searching film transcripts…');
  const entries=await index;
  if(input.value.trim()!==query)return;
  if(!entries){
   films.textContent=t('影片搜索暂不可用，仍可查看课程和讲义结果。','Film search is unavailable. Lesson and reading results still work.');
   index=null;
   return;
  }
  const matches=findFilmPassages(entries,query,EN?'en':'zh');
  films.innerHTML=matches.length ? `<h3 class="search-group">${t('影片片段','Film excerpts')}</h3>`+
   matches.slice(0,8).map(({id,title,time,text,language})=>{
    const lesson=lessons.get(id);
    const url=lesson ? moduleURL(lesson) : languageRoot+'courses/partitioning/index.html';
    const label=lesson ? `Lesson ${lesson.id}` : t('导论片','Introduction');
    return `<a class="search-result" href="${url}#film-${time}"><small>${label} · ${filmClock(time)} · ${esc(t(title))}</small><span lang="${language}">${esc(text)}</span></a>`;
   }).join('')+(matches.length>8 ? `<p class="search-note">${t('仅显示前 8 个片段，可以用更具体的关键词缩小范围。','Showing the first 8 excerpts. Use a more specific phrase to narrow the results.')}</p>` : '') : '';
  if(!matches.length&&!readings.childElementCount){
   films.textContent=t('没有结果。试试“增益”“容量”或 Fiedler。','No results. Try gain, capacity or Fiedler.');
  }
 });
}
