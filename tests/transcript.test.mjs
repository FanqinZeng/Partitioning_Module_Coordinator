import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passageAt,matchesPassage,findFilmPassages,linkedFilmTime} from '../site/assets/transcript-timeline.js';

const films=['home',...'02 03 04 05 06 07 08'.split(' ').map(id=>'lessons/'+id)].map(path=>
 JSON.parse(readFileSync(new URL(`../site/media/${path}/film.json`,import.meta.url),'utf8')));

test('every delivered film selects exactly one passage at starts, interiors, and the final frame',()=>{
 for(const film of films){
  const cues=film.captions;
  assert.equal(passageAt(cues,-1),-1);
  for(let i=0;i<cues.length;i++){
   assert.equal(passageAt(cues,cues[i].start),i);
   assert.equal(passageAt(cues,(cues[i].start+cues[i].end)/2),i);
   assert.equal(passageAt(cues,cues[i].end-0.001),i);
  }
  assert.equal(passageAt(cues,film.duration),cues.length-1);
  assert.equal(passageAt(cues,film.duration+1),-1);
 }
 const gap=[{start:2,end:4},{start:6,end:8}];
 for(const time of [0,4,5,NaN,Infinity])assert.equal(passageAt(gap,time),-1);
 assert.equal(passageAt([],0),-1);
});

test('transcript search handles bilingual course terms, blank input and literal special characters',()=>{
 const captions=films[1].captions.map(c=>c.text.join(' '));
 assert.equal(captions.filter(text=>matchesPassage(text,'容量')).length,1);
 assert.ok(captions.some(text=>matchesPassage(text,' ＣＵＴ ')));
 assert.ok(captions.some(text=>matchesPassage(text,'2/3')));
 assert.equal(captions.filter(text=>matchesPassage(text,'  ')).length,captions.length);
 assert.equal(captions.filter(text=>matchesPassage(text,'<script>')).length,0);
 assert.equal(matchesPassage('cut = 5 + 1','.*'),false);
 assert.equal(matchesPassage('a < b','<'),true);
});

test('course film search links both translations to the same authored timestamp',()=>{
 const index=JSON.parse(readFileSync(new URL('../site/data/film-search.json',import.meta.url),'utf8'));
 assert.equal(index.length,films.length);
 for(const [i,film] of films.entries()){
  assert.equal(index[i].id,film.lesson??'home');
  assert.deepEqual(index[i].captions,film.captions.map(c=>[c.start,...(c.text??[c.zh,c.en])]));
 }
 const english=findFilmPassages(index,'ABC OVERFLOWS','en');
 const chinese=findFilmPassages(index,'ABC 超出容量','en');
 assert.deepEqual(english.map(r=>[r.id,r.time,r.language]),[['02',70,'en']]);
 assert.deepEqual(chinese.map(r=>[r.id,r.time,r.language]),[['02',70,'zh']]);
 const starts=new Set(films[1].captions.map(c=>c.start));
 assert.equal(linkedFilmTime('#film-0',starts),0);
 assert.equal(linkedFilmTime('#film-70',starts),70);
 for(const hash of ['#watch','#film--10','#film-71','#film-70.0','#film-100','#film-070']){
  assert.equal(linkedFilmTime(hash,starts),null);
 }
 assert.deepEqual(findFilmPassages(index,'  ','en'),[]);
});
