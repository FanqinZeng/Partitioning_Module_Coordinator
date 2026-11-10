import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessonPlan} from '../site/assets/progress-plan.js';
import {emptyState, validateState, CHALLENGE_KEYS, readState} from '../site/assets/state.js';
const course=JSON.parse(readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));

test('review plans cover real questions and keep missing and false answers unfinished',()=>{
 for(const lesson of course){
  const fresh=lessonPlan(lesson);
  assert.equal(fresh.remaining,10);
  assert.equal(fresh.solved,0);
  assert.deepEqual(fresh.next,{kind:'reading',anchor:'#reading'});
  assert.deepEqual(fresh.pending.map(q=>q.id),CHALLENGE_KEYS[lesson.id]);
  assert.ok(fresh.pending.every(q=>q.prompt.length===2&&q.anchor===`#challenge-${q.id}`));
  const keys=CHALLENGE_KEYS[lesson.id];
  const record={read:true,lab:true,code:false,answers:{[keys[0]]:true,[keys[1]]:false,unknown:true}};
  const copy=structuredClone(record),plan=lessonPlan(lesson,record);
  assert.equal(plan.solved,1);
  assert.equal(plan.remaining,7);
  assert.equal(plan.pending[0].number,2);
  assert.deepEqual(plan.next,{kind:'challenge',anchor:`#challenge-${keys[1]}`,number:2});
  assert.deepEqual(record,copy,'a review plan does not change completion records');
 }
});

test('returning to progress refreshes another page’s saved answers',()=>{
 let stored=JSON.stringify(emptyState());
 globalThis.localStorage={getItem:()=>stored};
 assert.equal(lessonPlan(course[0],readState(true).modules['02']).solved,0);
 stored=JSON.stringify({version:1,last:'02',modules:{'02':{answers:{cut:true,good:true}}}});
 const refreshed=readState(true);
 assert.equal(lessonPlan(course[0],refreshed.modules['02']).solved,2);
 assert.equal(lessonPlan(course[0],refreshed.modules['02']).pending[0].id,'ratio');
 stored=JSON.stringify(emptyState());
 assert.equal(lessonPlan(course[0],readState(true).modules['02']).solved,0);
 delete globalThis.localStorage;
});

test('next activity progresses through existing flags and remains compatible with v1 exports',()=>{
 const lesson=course[0],state=emptyState();
 state.modules[lesson.id]={read:true,lab:false,code:false,draft:'print(1)',answers:{cut:true}};
 const imported=validateState(JSON.parse(JSON.stringify(state)));
 const record=imported.modules[lesson.id];
 assert.equal(lessonPlan(lesson,record).next.kind,'lab');
 record.lab=true;
 assert.equal(lessonPlan(lesson,record).next.anchor,'#challenge-good');
 record.answers=Object.fromEntries(CHALLENGE_KEYS[lesson.id].map(id=>[id,true]));
 assert.deepEqual(lessonPlan(lesson,record).next,{kind:'code',anchor:'#code'});
 assert.equal(lessonPlan(lesson,record).remaining,1);
 record.code=true;
 assert.equal(lessonPlan(lesson,record).remaining,0);
 assert.equal(lessonPlan(lesson,record).next,null);
 assert.deepEqual(lessonPlan(lesson,record).pending,[]);
 assert.equal(validateState(imported).modules[lesson.id].draft,'print(1)');
});
