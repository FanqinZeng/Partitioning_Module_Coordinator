import './core.js';
import {run,G01,BAD,GOOD,metrics} from '../engines/course.js';
import {graphSVG} from './graph.js';
import {t,fmt,table} from './ui.js';
import {mountHomeFilm} from './home-film.js';
mountHomeFilm();
const graph=document.querySelector('[data-hero-graph]');
function show(a){graph.innerHTML=graphSVG(G01,a,{dark:false});document.querySelector('[data-hero-cut]').textContent=fmt(metrics(G01,a).cut);}
document.querySelector('[data-hero-bad]').onclick=()=>show(BAD);document.querySelector('[data-hero-good]').onclick=()=>show(GOOD);show(BAD);
const rows=[
 [t('评价当前分组','Evaluate assignment'),'metrics',{},t('固定 AE | BCD，只评价','Evaluate fixed AE | BCD')],
 [t('初始生长','Initial growing'),'initial',{},t('人数 2 / 3','Counts 2 / 3')],
 ['Kernighan–Lin','kl',{},t('保持起点人数 2 / 3','Preserve initial counts 2 / 3')],
 ['Fiduccia–Mattheyses','fm',{},t('人数差 ≤1','Count difference ≤1')],
 [t('谱二分','Spectral bisection'),'spectral',{},t('每侧至少 20% 人数','Each side ≥20% of vertices')],
 [t('递归二分','Recursive bisection'),'recursive',{k:3},t('k=3，局部 20% 人数窗口','k=3, local 20% count window')],
 [t('轮转基线','Round-robin baseline'),'multiway',{k:3,strategy:'round-robin'},t('k=3，输入顺序轮转','k=3, input-order round robin')]
].map(([name,method,params,contract])=>{const r=run(method,G01,params),groups={};for(const[n,p]of Object.entries(r.result.assignment))(groups[p]||=[]).push(n);return [name,contract,Object.values(groups).map(ns=>ns.sort().join('')).join(' | '),fmt(r.result.metrics.cut)];});
document.querySelector('#home-comparison').innerHTML=table([t('方法','Method'),t('约束 / 操作','Contract / operation'),t('结果分组','Grouping'),'cut'],rows);
