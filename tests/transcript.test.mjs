import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {passageAt,matchesPassage} from '../site/assets/transcript-timeline.js';

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
