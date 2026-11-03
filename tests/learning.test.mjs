import test from 'node:test';
import assert from 'node:assert/strict';
import {challenges,checkAnswer} from '../site/assets/challenge-data.js';
import {validateState,emptyState,CHALLENGE_KEYS} from '../site/assets/state.js';

const methods=['metrics','initial','kl','fm','spectral','recursive','multiway'];
test('49 challenges have checked answers, bilingual feedback and staged hints',()=>{
 methods.forEach((method,i)=>{
  const qs=challenges(method),id=String(i+2).padStart(2,'0');assert.equal(qs.length,7);assert.equal(new Set(qs.map(q=>q.id)).size,7);assert.equal(new Set(qs.map(q=>q.category)).size,3);assert.deepEqual(qs.map(q=>q.id),CHALLENGE_KEYS[id]);
  for(const q of qs){assert.equal(q.prompt.length,2);assert.equal(q.explain.length,2);assert.equal(q.hints.length,2);assert.ok(q.hints.every(h=>h.length===2&&h.every(Boolean)));assert.ok(checkAnswer(q,q.answer));assert.equal(checkAnswer(q,''),false);assert.equal(checkAnswer(q,'not-the-answer'),false);}
 });
});
test('numeric answers accept fractions but reject blanks, infinities and invalid fractions',()=>{
 const ratio=challenges('metrics').find(q=>q.id==='ratio');assert.ok(checkAnswer(ratio,'2/3'));assert.ok(checkAnswer(ratio,'0.666667'));for(const s of ['', ' ', 'NaN', 'Infinity', '2/0','2/3+1'])assert.equal(checkAnswer(ratio,s),false);
});
test('progress round-trips and only known lesson/challenge records are accepted',()=>{
 const s=emptyState();s.last='04';s.modules['04']={read:true,lab:false,code:true,draft:'print(1)',answers:{gain:true}};assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);
 for(const malformed of [{...s,version:2},{...s,last:'99'},{...s,modules:[]},{...s,modules:{'99':{}}},{...s,modules:{'04':{read:'yes'}}},{...s,modules:{'04':{answers:{unknown:true}}}},{...s,modules:{'04':{draft:'x'.repeat(100001)}}}])assert.throws(()=>validateState(malformed));
 const copy=validateState(s);copy.modules['04'].answers.gain=false;assert.equal(s.modules['04'].answers.gain,true);
});
