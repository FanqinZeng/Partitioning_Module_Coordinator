import {BAD, GOOD, G01, metrics} from '../engines/course.js';
import {graphSVG} from './graph.js';
import {esc} from './ui.js';
import {filmHints, FILM_CAPACITY as CAPACITY, FILM_CAPACITY_GRAPH as CAPACITY_GRAPH} from './film-hints.js';
const TITLES = {
  cut: ['预测割代价', 'Predict the cut'],
  capacity: ['让两组都放得下', 'Fit both parts'],
};

export function mountFilmActivities(host, {video, language, seek}) {
  const text = (zh, en) => language.value === 'en' ? en : zh;
  const titleFor = key => text(...TITLES[key]);
  const panel = host.querySelector('[data-film-activity]');
  const heading = panel.querySelector('h3');
  const question = panel.querySelector('[data-film-question]');
  const feedback = panel.querySelector('[data-film-feedback]');
  const resume = panel.querySelector('[data-film-resume]');
  const hints = document.createElement('div');
  hints.className = 'film-hints';
  hints.innerHTML = '<button type="button" data-film-hint disabled aria-controls="film-hint-list"></button>' +
    '<ol id="film-hint-list" data-film-hint-list aria-live="polite" aria-atomic="true" hidden></ol>';
  resume.before(hints);
  const hintButton = panel.querySelector('[data-film-hint]');
  const hintList = panel.querySelector('[data-film-hint-list]');
  const cues = [...host.querySelectorAll('[data-film-cue]')].map(button => ({
    key: button.dataset.filmCue, time: Number(button.dataset.time), button,
  }));
  const opened = new Set();
  let previousTime = video.currentTime;
  let active = null;
  let assignment;
  let prediction;
  let checked;
  let attempted = false;
  let hintLevel = 0;

  function updateHints() {
    const hints = filmHints(active.key, assignment);
    hintButton.disabled = !attempted || hintLevel >= hints.length;
    hintButton.textContent = !attempted
      ? text('先提交一次，再看提示', 'Try an answer first to unlock hints')
      : hintLevel >= hints.length
        ? text('已展开全部提示', 'All hints shown')
        : text(`查看提示 ${hintLevel + 1} / ${hints.length}`, `Show hint ${hintLevel + 1} / ${hints.length}`);
    hintList.hidden = hintLevel === 0;
    hintList.innerHTML = hints.slice(0, hintLevel).map(hint => `<li>${esc(text(...hint))}</li>`).join('');
  }

  function updateLabels() {
    host.querySelector('[data-film-activity-intro]').textContent = text(
      '影片会在两处暂停，让你先算割代价，再动手调整分组。也可点击时间重做。',
      'The film pauses twice. Predict a cut, then move vertices to meet a capacity. Select a time to retry.',
    );
    for (const cue of cues) {
      const timestamp = String(Math.floor(cue.time / 60)).padStart(2,'0') + ':' + String(cue.time % 60).padStart(2,'0');
      cue.button.textContent = timestamp + ' · ' + titleFor(cue.key);
    }
  }

  function showFeedback() {
    updateHints();
    resume.textContent = checked ? text('继续播放', 'Continue watching') : text('跳过并继续', 'Skip and continue');
    if (!checked) {
      feedback.textContent = '';
      return;
    }
    if (active.key === 'cut') {
      const result = metrics(G01, BAD);
      const edges = result.cutEdges.map(({u,v,w}) => u + '–' + v + ' (' + w + ')').join(' + ');
      feedback.textContent = Number(prediction) === result.cut
        ? text(`正确。只加跨组边，每条算一次。${edges} = ${result.cut}。`, `Correct. Count each crossing edge once. ${edges} = ${result.cut}.`)
        : text('再试一次。只加两端属于不同组的边权，每条边只算一次。', 'Try again. Add the weights of edges whose endpoints belong to different parts, once per edge.');
      return;
    }
    const {cut, counts, areas, nonempty, feasible} = metrics(CAPACITY_GRAPH, assignment, 2, CAPACITY);
    const reason = feasible
      ? text('可行，两组都非空，面积都在容量内。', 'Feasible. Both parts are nonempty and within capacity.')
      : nonempty
        ? text(`有一组的面积超过 ${CAPACITY}。试着把一个节点换组再检查。`, `A part exceeds capacity ${CAPACITY}. Move a vertex and check again.`)
        : text('有一组为空。两组都需要至少一个节点。', 'One part is empty. Both parts need at least one vertex.');
    feedback.textContent = text(
      `${reason} 组 0 和组 1 的节点数是 ${counts.join(' / ')}，面积是 ${areas.join(' / ')}，割代价为 ${cut}。`,
      `${reason} Parts 0 and 1 have counts ${counts.join(' / ')}, areas ${areas.join(' / ')} and cut ${cut}.`,
    );
  }

  function paintAssignment() {
    question.querySelector('[data-cue-graph]').innerHTML = graphSVG(CAPACITY_GRAPH, assignment, {
      label: text('当前分组与跨组边', 'Current parts and crossing edges'), translate: text,
    });
    for (const button of question.querySelectorAll('[data-move-vertex]')) {
      const id = button.dataset.moveVertex;
      const {size} = CAPACITY_GRAPH.nodes.find(node => node.id === id);
      const part = assignment[id];
      button.textContent = text(`${id} · 组 ${part} · 面积 ${size}`, `${id} · Part ${part} · Area ${size}`);
      button.setAttribute('aria-label', text(`移动节点 ${button.textContent}`, `Move vertex ${button.textContent}`));
    }
  }

  function renderActivity() {
    heading.textContent = titleFor(active.key);
    const isCut = active.key === 'cut';
    const instructions = isCut
      ? text('图上 AE 在组 0，BCD 在组 1。请预测加权割代价。', 'AE is in part 0 and BCD is in part 1. Predict the weighted cut.')
      : text(`A 的面积为 4，其余节点面积为 1。每组容量是 ${CAPACITY}。点击节点按钮换组，让两组非空且都装得下。`, `A has area 4 and every other vertex has area 1. Capacity is ${CAPACITY} per part. Use the vertex buttons to make both parts nonempty and fit within capacity.`);
    const edgeList = G01.edges.map(({u,v,w}) => u + '–' + v + ' ' + w).join(' · ');
    const controls = isCut
      ? `<p>${text('边与权重','Edges and weights')} · ${edgeList}</p>
         <label>${text('你的预测','Your prediction')} <input name="prediction" type="number" min="0" required value="${esc(prediction)}"></label>`
      : `<div class="film-vertex-buttons">${CAPACITY_GRAPH.nodes.map(({id}) =>
          `<button type="button" data-move-vertex="${esc(id)}"></button>`).join('')}</div>`;
    question.innerHTML = `<p>${instructions}</p><div class="film-activity-grid">
      <div data-cue-graph></div>
      <form>${controls}<button type="submit">${isCut ? text('检查预测','Check prediction') : text('检查容量','Check capacity')}</button></form>
    </div>`;
    if (isCut) {
      question.querySelector('[data-cue-graph]').innerHTML = graphSVG(G01, BAD, {
        label: text('加权图，分组为 AE 与 BCD', 'Weighted graph with parts AE and BCD'), translate: text,
      });
      question.querySelector('input').addEventListener('input', event => {
        prediction = event.target.value;
        checked = false;
        showFeedback();
      });
    } else {
      paintAssignment();
    }
    showFeedback();
  }

  function open(cue) {
    video.pause();
    active = cue;
    opened.add(cue.key);
    checked = false;
    attempted = false;
    hintLevel = 0;
    prediction = '';
    assignment = {...GOOD};
    panel.hidden = false;
    seek(cue.time);
    renderActivity();
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'nearest'});
  }

  function close() {
    if (panel.contains(document.activeElement)) active.button.focus({preventScroll:true});
    active = null;
    panel.hidden = true;
  }

  cues.forEach(cue => cue.button.addEventListener('click', () => open(cue)));
  question.addEventListener('submit', event => {
    event.preventDefault();
    checked = true;
    attempted = true;
    showFeedback();
  });
  hintButton.addEventListener('click', () => {
    if (!attempted || hintLevel >= 2) return;
    hintLevel++;
    updateHints();
  });
  question.addEventListener('click', event => {
    const vertex = event.target.closest('[data-move-vertex]')?.dataset.moveVertex;
    if (!vertex) return;
    assignment[vertex] = 1 - assignment[vertex];
    checked = false;
    paintAssignment();
    showFeedback();
  });
  resume.addEventListener('click', () => {
    close();
    video.play().catch(() => {});
  });
  language.addEventListener('change', () => {
    updateLabels();
    if (active) renderActivity();
  });

  // Set the new starting point before playback can report the new time.
  video.addEventListener('filmseek', event => {
    previousTime = event.detail;
  });
  video.addEventListener('seeking', () => {
    previousTime = video.currentTime;
  });
  video.addEventListener('seeked', () => {
    previousTime = video.currentTime;
    if (active && Math.abs(previousTime - active.time) > 0.25) close();
  });
  video.addEventListener('playing', () => {
    if (active && !video.paused) close();
  });
  video.addEventListener('timeupdate', () => {
    if (video.seeking || video.readyState < 1 || video.paused || active) return;
    const cue = cues.find(({key,time}) => !opened.has(key) && previousTime < time && time <= video.currentTime);
    previousTime = video.currentTime;
    if (cue) open(cue);
  });

  updateLabels();
  host.hidden = false;
}
