import {course} from './core.js';
import {t,root} from './ui.js';
import {visit,readState,updateLesson} from './state.js';
import {mountLab} from './lab.js';
import {mountChallenges} from './challenges.js';
import {mountCodeLab} from './codelab.js';
import {mountHomeFilm} from './home-film.js';
import {mountFilmActivities} from './film-activities.js';
const module=course.find(m=>m.id===document.body.dataset.module);
visit(module.id);
const film=mountHomeFilm();
const activities=document.querySelector('[data-film-activities]');
if(activities)mountFilmActivities(activities,film);
mountLab(document.querySelector('#lab-root'),module);
const inline=document.querySelector('[data-inline-lab]');if(inline)mountLab(inline,module,{inline:true});
mountChallenges(document.querySelector('#challenges-root'),module);
mountCodeLab(document.querySelector('#code-root'),module).catch(e=>{document.querySelector('#code-root').textContent=t('无法加载编程区：','Unable to load code lab: ')+e.message;});
const read=document.querySelector('[data-mark-read]');
function paint(){const done=readState().modules[module.id]?.read;read.textContent=done?t('已完成阅读 ✓','Reading completed ✓'):t('我已读完本章','Mark reading complete');read.setAttribute('aria-pressed',String(!!done));}
paint();read.onclick=()=>{updateLesson(module.id,p=>p.read=!p.read);paint();};
// Slide text and transcript are ordinary HTML, not rasterized images.
const slides=[...document.querySelectorAll('.web-slide')];let current=0;
function display(){slides.forEach((s,i)=>s.hidden=i!==current);document.querySelector('[data-slide-counter]').textContent=`${current+1} / ${slides.length}`;document.querySelector('[data-slide-prev]').disabled=current===0;document.querySelector('[data-slide-next]').disabled=current===slides.length-1;}
document.querySelector('[data-slide-prev]').onclick=()=>{current=Math.max(0,current-1);display();};document.querySelector('[data-slide-next]').onclick=()=>{current=Math.min(slides.length-1,current+1);display();};display();
