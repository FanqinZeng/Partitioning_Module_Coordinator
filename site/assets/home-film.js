import {t} from './ui.js';

export function mountHomeFilm(){
 const video=document.querySelector('[data-home-video]');if(!video)return;
 const language=document.querySelector('[data-home-film-lang]'),speed=document.querySelector('[data-home-film-speed]'),status=document.querySelector('[data-home-film-status]');
 const chapterButtons=[...document.querySelectorAll('[data-home-chapter]')];
 const base=new URL('../media/home/',import.meta.url);let changed=0,lastChapter=-1,pending=null;
 function seek(time,play=false){
  if(video.readyState>=1){video.currentTime=Math.min(time,video.duration||190);if(play)video.play().catch(()=>status.textContent=t('已定位章节，点击播放继续。','Chapter selected. Press Play to continue.'));}
  else{pending={time,play};video.load();}
 }
 video.addEventListener('loadedmetadata',()=>{video.playbackRate=Number(speed.value);if(pending){const target=pending;pending=null;seek(target.time,target.play);}});
 chapterButtons.forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.homeChapter),true)));
 document.querySelectorAll('[data-home-seek]').forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.homeSeek),true)));
 speed.addEventListener('change',()=>video.playbackRate=Number(speed.value));
 language.addEventListener('change',()=>{
  const time=video.currentTime,playing=!video.paused,token=++changed,lang=language.value;
  video.pause();
  video.src=new URL(`intro.${lang}.mp4`,base).href;
  video.poster=new URL(`intro.${lang}.jpg`,base).href;
  const track=video.querySelector('track');track.src=new URL(`intro.${lang}.vtt`,base).href;track.srclang=lang;
  document.querySelectorAll('[data-home-transcript-lang]').forEach(el=>el.hidden=el.dataset.homeTranscriptLang!==lang);
  document.querySelector('[data-home-download]').href=video.src;
  document.querySelector('[data-home-captions]').href=track.src;
  document.querySelector('[data-home-text]').href=new URL(`intro.${lang}.md`,base).href;
  video.addEventListener('loadedmetadata',()=>{if(token!==changed)return;seek(time,playing);},{once:true});
  video.load();status.textContent=t('已切换画面语言，保留当前播放位置。','Film language changed; your playback position is preserved.');
 });
 video.addEventListener('timeupdate',()=>{
  let chapter=0;chapterButtons.forEach((b,i)=>{if(video.currentTime>=Number(b.dataset.homeChapter))chapter=i;});
  if(chapter===lastChapter)return;lastChapter=chapter;
  chapterButtons.forEach((b,i)=>{if(i===chapter)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  const selected=chapterButtons[chapter];if(selected)status.textContent=t('当前章节：','Current chapter: ')+selected.textContent.trim();
 });
 video.addEventListener('error',()=>status.textContent=t('影片加载失败，可使用下方 MP4 链接直接打开。','The film could not load. Use the MP4 link below to open it directly.'));
}
