import {t} from './ui.js';
export function mountMedia(){
 const video=document.querySelector('[data-original-video]');if(!video)return;
 document.querySelector('[data-video-speed]').addEventListener('change',e=>video.playbackRate=Number(e.target.value));
 document.querySelector('[data-video-language]')?.addEventListener('change',e=>{
  const wasPlaying=!video.paused;video.pause();video.src=e.target.value;video.load();
  document.querySelector('[data-video-status]').textContent=t('已切换影片，从头播放。','Film changed; playback starts from the beginning.');
  if(wasPlaying)video.play().catch(()=>{});
 });
 video.addEventListener('error',()=>{document.querySelector('[data-video-status]').textContent=t('原作者媒体暂时无法加载，可通过下方链接打开原页面。','The author-hosted media could not load. Open the original page using the link below.');});
}
