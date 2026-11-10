import {t} from './ui.js';
import {passageAt,matchesPassage} from './transcript-timeline.js';

export function mountFilmTranscript({video,language}) {
 const details=video.closest('.home-film').querySelector('.home-transcript');
 if(!details)return;
 const search=details.querySelector('[data-transcript-search]');
 const follow=details.querySelector('[data-transcript-follow]');
 const currentButton=details.querySelector('[data-transcript-current]');
 const result=details.querySelector('[data-transcript-result]');
 const versions=[...details.querySelectorAll('[data-home-transcript-lang]')].map(container=>({
  container,rows:[...container.querySelectorAll('[data-transcript-start]')],
 }));
 const cues=versions[0].rows.map(row=>({start:Number(row.dataset.transcriptStart),end:Number(row.dataset.transcriptEnd)}));
 let current=-1;
 const visible=()=>versions.find(version=>version.container.dataset.homeTranscriptLang===language.value);
 function revealCurrent(focus=false) {
  const version=visible(),row=version.rows[current];
  if(!row || row.hidden || !details.open)return;
  // Scroll only the transcript viewport; playback must not move the whole page.
  const bounds=version.container.getBoundingClientRect(),position=row.getBoundingClientRect();
  if(position.top<bounds.top || position.bottom>bounds.bottom){
   version.container.scrollTop+=position.top-bounds.top-8;
  }
  if(focus)row.querySelector('button').focus({preventScroll:true});
 }
 function sync(force=false) {
  const next=passageAt(cues,video.currentTime);
  if(next===current && !force)return;
  current=next;
  for(const version of versions)version.rows.forEach((row,index)=>{
   row.classList.toggle('is-current',index===current);
   const button=row.querySelector('button');
   if(index===current)button.setAttribute('aria-current','time');
   else button.removeAttribute('aria-current');
  });
  currentButton.disabled=current<0;
  if(follow.checked)revealCurrent();
 }
 function filter() {
  for(const version of versions)for(const row of version.rows){
   row.hidden=!matchesPassage(row.querySelector('span').textContent,search.value);
  }
  const count=visible().rows.filter(row=>!row.hidden).length;
  result.textContent=search.value.trim()
   ? count ? t(`找到 ${count} 句；点击时间回看。`,`Found ${count} passages. Select a timestamp to replay.`)
     : t('没有匹配的句子。试试另一个词，或清空搜索。','No matching passages. Try another term or clear the search.')
   : t('点击时间回看。开启跟随后，文字稿随影片滚动；手动浏览会暂停跟随。','Select a timestamp to replay. Enable Follow playback to scroll with the film; browsing manually stops following.');
 }
 search.addEventListener('input',()=>{follow.checked=false;filter();});
 follow.addEventListener('change',()=>{
  if(follow.checked){search.value='';filter();sync(true);}
 });
 currentButton.addEventListener('click',()=>{
  search.value='';filter();sync(true);revealCurrent(true);
 });
 for(const {container} of versions){
  const stop=()=>{follow.checked=false;};
  container.addEventListener('wheel',stop,{passive:true});
  container.addEventListener('touchstart',stop,{passive:true});
  container.addEventListener('pointerdown',stop);
  container.addEventListener('keydown',stop);
  container.addEventListener('focusin',stop);
 }
 language.addEventListener('change',()=>{filter();sync(true);});
 for(const event of ['timeupdate','seeking','seeked','loadedmetadata','ended'])video.addEventListener(event,()=>sync());
 details.addEventListener('toggle',()=>{if(details.open)sync(true);});
 details.querySelector('[data-transcript-tools]').hidden=false;
 result.hidden=false;
 filter();sync(true);
}
