import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchesCourse,matchesLesson,summarizeCourse} from '../site/assets/catalog-model.js';
const courses=JSON.parse(readFileSync(new URL('../content/courses.json',import.meta.url),'utf8'));
test('catalog search spans bilingual outlines and composes location/status/language filters',()=>{
 const cluster=courses.find(c=>c.id==='clustering'),partition=courses.find(c=>c.id==='partitioning');
 assert.ok(matchesCourse(cluster,{q:'KL'}));assert.ok(matchesCourse(partition,{q:'谱二分'}));
 assert.ok(matchesCourse(cluster,{q:'亲和度',delivery:'external',status:'ready',language:'zh'}));
 assert.ok(!matchesCourse(partition,{track:'clustering'}));assert.ok(!matchesCourse(partition,{delivery:'external'}));assert.ok(!matchesCourse(cluster,{q:'无匹配课程'}));
 assert.ok(!matchesCourse(cluster,{status:'planned'}));assert.ok(!matchesCourse(cluster,{language:'fr'}));
});
test('course progress counts completed actions, ignores unrelated records and never invents external progress',()=>{
 const partition=courses.find(c=>c.id==='partitioning'),cluster=courses.find(c=>c.id==='clustering');
 const state={last:'03',modules:{'02':{read:true,lab:true,code:true,answers:Object.fromEntries(['a','b','c','d','e','f','g'].map(k=>[k,true]))},'03':{read:true,answers:{q:false}},'99':{read:true}}};
 assert.deepEqual(summarizeCourse(partition,state),{done:11,total:70,lessons:1,percent:16,last:'03'});
 assert.equal(summarizeCourse(cluster,state),null);assert.equal(summarizeCourse(partition,{last:'99',modules:{}}).last,null);
});

test('lesson abbreviations lead to the right algorithm lessons',()=>{
 const units=courses.flatMap(c=>c.outline);
 assert.equal(units.filter(u=>matchesLesson(u,'KL')).length,2);
 assert.equal(units.filter(u=>matchesLesson(u,'FM')).length,2);
 assert.equal(units.filter(u=>matchesLesson(u,'Fiedler')).length,2);
 assert.equal(units.filter(u=>matchesLesson(u,'')).length,0);
});
