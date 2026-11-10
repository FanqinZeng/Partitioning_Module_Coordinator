import {lessonPlan} from './progress-plan.js';
import {t, esc, moduleURL} from './ui.js';

export function progressMarkup(course, state) {
  return course.map(lesson => {
    const plan = lessonPlan(lesson, state.modules[lesson.id]);
    const url = moduleURL(lesson);
    const labels = {reading:t('阅读讲义', 'Read the lesson'), lab:t('做实验', 'Try the lab'), code:t('写 Python', 'Write Python')};
    const nextLabel = plan.next?.kind === 'challenge'
      ? t(`完成挑战 ${plan.next.number}`, `Try challenge ${plan.next.number}`)
      : labels[plan.next?.kind] || t('复习本章', 'Review this lesson');
    const pending = plan.pending.length ? `<details class="progress-questions">
      <summary>${t(`查看未完成挑战（${plan.pending.length}）`, `Unfinished challenges (${plan.pending.length})`)}</summary>
      <p class="small muted">${t('这里只记录是否答对；未完成可能是尚未作答，也可能仍需重试。', 'Only correct completion is stored. Unfinished questions may be unattempted or still need another try.')}</p>
      <ol>${plan.pending.map(q => `<li value="${q.number}"><a href="${url}${q.anchor}">${esc(t(q.prompt))}<span aria-hidden="true"> →</span></a></li>`).join('')}</ol>
    </details>` : `<p class="progress-questions small">${t('本章挑战已全部答对。', 'All challenges in this lesson are completed.')} <a href="${url}#challenges">${t('重新练习', 'Practice again')} →</a></p>`;
    return `<article class="progress-row" data-progress-lesson="${lesson.id}">
      <a href="${url}"><small>Lesson ${lesson.id}</small><h3>${esc(t(lesson.title))}</h3></a>
      <span>${t('阅读','Reading')} ${plan.read?'✓':'—'}</span>
      <span>${t('实验','Lab')} ${plan.lab?'✓':'—'}</span>
      <span>${t('挑战','Challenges')} ${plan.solved}/${plan.total}</span>
      <span>Python ${plan.code?'✓':'—'}</span>
      <div class="progress-actions"><span>${plan.remaining ? t(`还剩 ${plan.remaining} 项活动`, `${plan.remaining} ${plan.remaining===1?'activity':'activities'} remaining`) : t('本章全部完成 ✓', 'All activities completed ✓')}</span>
        <a class="btn quiet" data-progress-next href="${url}${plan.next?.anchor || '#goals'}">${nextLabel} →</a></div>
      ${pending}
    </article>`;
  }).join('');
}
