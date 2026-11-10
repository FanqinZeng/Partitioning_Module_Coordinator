import {challenges} from './challenge-data.js';

// Use the existing v1 completion flags. A missing/false answer is unfinished;
// the stored data cannot tell whether it was unattempted or answered wrongly.
export function lessonPlan(lesson, record = {}) {
  const questions = challenges(lesson.method);
  const pending = questions.flatMap((q, index) => record.answers?.[q.id] === true ? [] : [{
    id: q.id, number: index + 1, prompt: q.prompt, anchor: `#challenge-${q.id}`,
  }]);
  const read = record.read === true, lab = record.lab === true, code = record.code === true;
  const solved = questions.length - pending.length;
  const remaining = [read, lab, code].filter(done => !done).length + pending.length;
  const next = !read ? {kind:'reading', anchor:'#reading'} :
    !lab ? {kind:'lab', anchor:'#lab'} :
    pending.length ? {kind:'challenge', anchor:pending[0].anchor, number:pending[0].number} :
    !code ? {kind:'code', anchor:'#code'} : null;
  return {read, lab, code, solved, total:questions.length, remaining, pending, next};
}
