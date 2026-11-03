import {challenges,checkAnswer} from './challenge-data.js';
import {readState,updateLesson} from './state.js';
import {t,esc} from './ui.js';
export function mountChallenges(host,module){
 const qs=challenges(module.method);let solved=readState().modules[module.id]?.answers||{};
 const cats={compute:t('计算','Compute'),predict:t('预测','Predict'),diagnose:t('诊断','Diagnose')};
 host.innerHTML=qs.map((q,i)=>`<article class="challenge" id="challenge-${q.id}"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${cats[q.category]} / ${q.level} ${solved[q.id]?'✓':''}</p><h3>${esc(t(q.prompt))}</h3><p class="small muted">${esc(t(q.purpose))}</p><form data-q="${q.id}">${q.type==='choice'?`<fieldset><legend class="sr-only">${esc(t(q.prompt))}</legend>${q.options.map(([value,label])=>`<label class="answer-option"><input type="radio" name="answer" value="${esc(value)}" required> ${esc(t(label))}</label>`).join('')}</fieldset>`:`<label>${t('你的答案','Your answer')}<input name="answer" ${q.type==='number'?'inputmode="decimal"':''} autocomplete="off" required></label>`}<button class="btn primary" type="submit">${t('检查答案','Check answer')}</button></form><div class="hint-row">${q.hints.map((hint,j)=>`<details><summary>${t('提示','Hint')} ${j+1}</summary><p>${esc(t(hint))}</p></details>`).join('')}</div><div class="challenge-feedback" role="status"></div></article>`).join('');
 host.addEventListener('submit',e=>{
  const form=e.target.closest('[data-q]');if(!form)return;e.preventDefault();const q=qs.find(q=>q.id===form.dataset.q),value=new FormData(form).get('answer'),ok=checkAnswer(q,value),article=form.closest('.challenge'),feedback=article.querySelector('.challenge-feedback');
  feedback.className='challenge-feedback '+(ok?'correct':'retry');
  feedback.textContent=(ok?t('正确。','Correct. '):t('再试一次。','Try again. '))+t(q.explain);
  if(ok){updateLesson(module.id,p=>p.answers[q.id]=true);article.querySelector('.eyebrow').textContent=`${qs.indexOf(q)+1} / ${cats[q.category]} / ${q.level} ✓`;}
 });
}
