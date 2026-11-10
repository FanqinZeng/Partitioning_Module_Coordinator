import {t} from './ui.js';

// A tour describes the live page. It never runs an exercise or marks progress.
const step = (selector, title, description) => ({selector, title, description});
const isMetrics = document.body.dataset.module === '02';
const navigation = (path) => `.topnav a[href$="${path}"], .mobile-nav summary`;
const language = step('.lang-switch', ['切换中英文', 'Choose your language'],
  ['这里切换整个网站的语言。影片还可以在播放器下方单独切换语言。退出引导后即可操作。',
   'Switch the language of the whole site here. Films also have their own language selector below the player. Exit the tour to try it.']);
const progress = step(navigation('progress/index.html'), ['找到学习记录', 'Find your progress'],
  ['从顶部导航进入「学习记录」（手机上先展开「导航」）。完成记录只保存在当前浏览器，可以导出备份。',
   'Open Progress in the top navigation (open Menu on a phone). Completed activities stay in this browser; export a backup to keep them.']);
const compare = step(navigation('compare/index.html'), ['用同一张图比较算法', 'Compare algorithms on one graph'],
  ['从顶部导航进入「同图比较」（手机上先展开「导航」）。固定输入、比较结果，还可以复制实验链接。',
   'Open Compare in the top navigation (open Menu on a phone). Use the same input for each method and copy a link to your experiment.']);
const tours = {
  portal: [
    step('.hub-hero .btn.primary', ['先选一门课程', 'Start by choosing a course'],
      ['点击「探索课程」查看课程地图、大纲和学习目标。两门课程可以独立学习。', 'Explore courses opens the map, outlines and learning goals. The two courses can be studied independently.']),
    step('[data-hub-course="partitioning"] h3', ['本站学习 Partitioning', 'Learn Partitioning here'],
      ['这张卡片进入「划分与取舍」。里面有七章影片、交互实验、挑战题和 Python 练习。', 'This card opens Partitioning, with seven lessons of films, interactive labs, challenges and Python exercises.']),
    step('[data-hub-course="clustering"] h3', ['保留 Clustering 原站', 'Visit the Clustering course'],
      ['Clustering 会打开原作者的课程网站，学习记录也由原站保存。', 'Clustering opens the original author’s course. Its learning records remain on that site.']),
    language, progress,
  ],
  home: [
    step('.hero .btn.primary', ['从第一章开始', 'Start with the first lesson'],
      ['点击这里进入 Lesson 02，先理解割代价和平衡。每章都可以直接进入，无需登录。', 'Open Lesson 02 to understand cut cost and balance. Every lesson is open; no sign-in is needed.']),
    step('#intro h2', ['先看首页导论片', 'Watch the introduction'],
      ['下方是 3 分 10 秒的导论片。点击播放器的播放键，先认识整个课程要解决的问题。', 'The 3:10 introduction is below this heading. Press Play in the player to meet the questions explored in the course.']),
    step('[data-home-film-lang]', ['影片可以单独切换语言', 'Choose the film language'],
      ['选择中文或 English。旁边可以调整速度，下方章节时间与文字稿都可跳转影片。', 'Choose Chinese or English. Adjust speed beside it; chapter times and transcript entries also seek through the film.']),
    step('#curriculum h2', ['按目标选择章节', 'Pick a lesson by its goal'],
      ['下方七张章节卡片可直接进入对应课时。建议先学割代价，再学构造、改进与多路划分。', 'The seven lesson cards below open each lesson. Start with costs, then construction, refinement and k-way partitioning.']),
    compare, progress,
  ],
  module: [
    step('#goals h2', ['先看本章目标', 'Read the lesson goals'],
      ['每章从学习目标和问题约束开始，先明确需要学会什么、哪些分组才合法。', 'Each lesson starts with goals and constraints. Find out what to learn and what makes an assignment feasible.']),
    step('#watch h2', ['在这里观看影片', 'Watch the lesson film'],
      ['点击下方播放器的播放键。影片下方有语言、速度、章节跳转和完整文字稿。', 'Press Play in the player below. Language, speed, chapter shortcuts and a full transcript sit beneath it.']),
    step('.film-activity-buttons', ['影片暂停后，在下方动手', 'When the film pauses, try the activity'],
      ['Lesson 02 在 00:20 和 01:10 暂停。先填割代价，再移动节点检验容量；提交后查看解释，点击继续观看。这里也可以重做。', 'Lesson 02 pauses at 00:20 and 01:10. Predict the cut, then move vertices to check capacity. Submit, read the explanation and continue watching. These buttons let you retry.']),
    step('#reading .lesson-prose h2', ['读解释，再检查理解', 'Read and check your understanding'],
      ['讲义里有推导和随文实验。读完后用讲义末尾的「我已读完本章」记录阅读完成。', 'The lesson includes explanations and embedded experiments. Use Mark reading complete at the end when you finish reading.']),
    isMetrics ? step('#lab-root [data-node="A"], #lab h2', ['点击节点，观察分组变化', 'Move a vertex and inspect the change'],
      ['退出引导后，点击图上的节点给它换组；也可用 Tab 选中节点后按 Enter。观察跨组边、割代价与面积如何变化。', 'After exiting the tour, select a vertex to move it, or focus it with Tab and press Enter. Watch the crossing edges, cut cost and areas change.']) :
    step('#lab-root .playback, #lab h2', ['在实验台逐步观察', 'Explore the algorithm step by step'],
      ['退出引导后，用播放、单步和回退观察图与指标如何一起变化。到达最后一步才记录实验完成。', 'After exiting the tour, use Play, Step and Back to follow the graph and metrics. Lab completion is recorded only when you reach the final step.']),
    step('#challenges-root .challenge h3, #challenges h2', ['先作答，再看反馈', 'Try a challenge and read the feedback'],
      ['先提交自己的判断，再看解释。遇到困难可以展开提示，修改答案后重新提交。', 'Submit your own answer before reading the explanation. Open hints if needed and retry after revising your answer.']),
    step('#code h2', ['把算法写成 Python', 'Write the algorithm in Python'],
      ['在下方编程区补全函数并运行检查。草稿保存在本浏览器，全部检查通过才记录代码完成。', 'Complete the functions in the editor below and run the checks. Drafts stay in this browser; code completion requires all checks to pass.']),
    progress,
  ],
  catalog: [
    step('.path-foundation', ['从共同基础出发', 'Start with shared foundations'],
      ['这里可以复习节点、边权、割代价与面积。地图是学习建议，不会锁定课程。', 'Review vertices, weights, cut cost and area here. The map is a suggestion; it never locks access.']),
    step('[data-catalog-filters] input', ['搜索课程或课时', 'Search courses and lessons'],
      ['输入 KL、谱二分等关键词，也可以用旁边的筛选器缩小范围。', 'Search for KL, spectral or another topic. Use the filters beside the search field to narrow the results.']),
    step('[data-directory-course="partitioning"] .catalog-outline summary', ['先看课程大纲', 'Preview the outline'],
      ['展开大纲查看各章主题，再点击对应课时或「进入课程」。', 'Expand the outline to see lesson topics, then select a lesson or Open course.']),
    language, progress,
  ],
  compare: [
    step('.compare-config', ['设置同一组实验条件', 'Set the comparison conditions'],
      ['选择组数和面积容量，点击「重新比较」。两张结果表分别说明二分和多路方法的约束。', 'Choose the part count and area capacity, then Compare again. The two result tables state the contracts for bisection and k-way methods.']),
    step('[data-bisection-table]', ['先核对约束，再比较割代价', 'Check constraints before cut cost'],
      ['比较表显示真实算法结果。先排除不可行结果，再解释为什么各方法的割代价不同。', 'These are real algorithm results. Exclude infeasible assignments before interpreting differences in cut cost.']),
    step('[data-share-comparison]', ['保存可复现的实验链接', 'Keep a reproducible experiment link'],
      ['复制链接后，可以重新打开同一张图、组数与容量。链接反映最近一次成功计算。', 'Copy a link to reopen the same graph, part count and capacity. It reflects the last successful calculation.']),
  ],
  progress: [
    step('.progress-row', ['分别查看完成情况', 'Check each activity separately'],
      ['阅读、实验、挑战和 Python 分别记录。点击章节标题可以回到该课时。', 'Reading, labs, challenges and Python are recorded separately. Select the lesson title to return to it.']),
    step('[data-export]', ['先导出备份', 'Export a backup'],
      ['记录仅存在当前浏览器。更换设备或清理浏览器前，先导出记录文件。', 'Records stay in this browser. Export a file before changing devices or clearing browser data.']),
    step('.file-label', ['在另一台设备恢复', 'Restore on another device'],
      ['用导出的文件导入并替换记录。导入前会校验格式，失败会保留现有记录。', 'Import the exported file to replace progress. Invalid files are rejected without replacing your existing records.']),
  ],
};

const launcher = document.querySelector('[data-tour-launcher]');
const dialog = document.createElement('dialog');
dialog.className = 'site-tour';
dialog.setAttribute('aria-labelledby', 'tour-title');
dialog.setAttribute('aria-describedby', 'tour-description');
dialog.innerHTML = `<div class="tour-ring" aria-hidden="true"></div>
  <section class="tour-card">
    <div class="tour-top"><span class="tour-count"></span><button type="button" data-tour-close>${t('退出引导', 'Exit tour')} ×</button></div>
    <div aria-live="polite" aria-atomic="true"><h2 id="tour-title" tabindex="-1"></h2><p id="tour-description"></p></div>
    <div class="tour-actions"><button type="button" class="btn quiet" data-tour-prev>${t('上一步', 'Back')}</button><button type="button" class="btn primary" data-tour-next></button></div>
    <p class="tour-hint">${t('圈出的是当前页面的真实功能 · Esc 可退出', 'Highlights point to real page features · Esc to exit')}</p>
  </section>`;
document.body.append(dialog);
const card = dialog.querySelector('.tour-card');
const ring = dialog.querySelector('.tour-ring');
const title = dialog.querySelector('#tour-title');
const next = dialog.querySelector('[data-tour-next]');
const previous = dialog.querySelector('[data-tour-prev]');
let steps = [], index = 0, target = null, returnFocus = null, returnScroll = 0, frame = 0;
const visibleTarget = selector => selector.split(',').flatMap(part => [...document.querySelectorAll(part.trim())]).find(el =>
  el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));

function position() {
  if (!dialog.open || !target) return;
  // Desktop navigation is replaced by the Menu control at narrow widths.
  target = visibleTarget(steps[index].selector);
  if (!target) { close(); return; }
  const viewport = window.visualViewport;
  const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
  const offsetX = viewport?.offsetLeft || 0, offsetY = viewport?.offsetTop || 0;
  const rect = target.getBoundingClientRect();
  const w = Math.min(width - 16, rect.width * 1.12 + 24);
  const h = Math.min(height * .46, rect.height * 1.4 + 24);
  const x = clamp(rect.left + rect.width / 2 - w / 2, offsetX + 8, offsetX + width - w - 8);
  const y = clamp(rect.top + Math.min(rect.height, h) / 2 - h / 2, offsetY + 8, offsetY + height - h - 8);
  Object.assign(ring.style, {left:`${x}px`, top:`${y}px`, width:`${w}px`, height:`${h}px`});
  card.style.width = `${Math.min(370, width - 24)}px`;
  card.style.maxHeight = `${height - 24}px`;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let left = clamp(x + w / 2 - cw / 2, offsetX + 12, offsetX + width - cw - 12);
  let top = y + h + 18;
  if (top + ch > offsetY + height - 12) {
    if (y - ch - 18 >= offsetY + 12) top = y - ch - 18;
    else if (x + w + cw + 30 < offsetX + width) {left = x + w + 18; top = y;}
    else if (x - cw - 18 >= offsetX + 12) {left = x - cw - 18; top = y;}
    else top = offsetY + height - ch - 12;
  }
  Object.assign(card.style, {left:`${left}px`, top:`${clamp(top, offsetY + 12, offsetY + height - ch - 12)}px`});
}
function schedulePosition() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(position);
}
function show() {
  const current = steps[index];
  target = visibleTarget(current.selector);
  if (!target) { close(); return; }
  title.textContent = t(current.title);
  dialog.querySelector('#tour-description').textContent = t(current.description);
  dialog.querySelector('.tour-count').textContent = `${t('使用引导', 'SITE TOUR')} · ${index + 1} / ${steps.length}`;
  previous.disabled = index === 0;
  next.textContent = index === steps.length - 1 ? t('完成引导', 'Finish tour') : t('下一步', 'Next');
  // Reserve space above for the sticky site and lesson navigation.
  if (!target.closest('.topbar')) {
    const inset = (document.querySelector('.topbar')?.offsetHeight || 0) +
      (document.querySelector('.module-nav')?.offsetHeight || 0) + 36;
    window.scrollBy({top:target.getBoundingClientRect().top - inset, behavior:'instant'});
  }
  position();
  title.focus({preventScroll:true});
}
function start(event) {
  if (dialog.open) return;
  const page = document.body.dataset.page;
  steps = (tours[page] || [
    step('.page-heading h1', ['查看本站帮助', 'Find help for this site'],
      ['右下角的「使用引导」会介绍当前页面。进入课程或课时后，也可以随时重新打开。', 'Use Site tour at the bottom right for a tour of the current page. You can restart it on course and lesson pages too.']),
    language, compare, progress,
  ]).filter(s => visibleTarget(s.selector));
  if (!steps.length) return;
  returnFocus = event?.currentTarget || launcher;
  returnScroll = scrollY;
  document.querySelectorAll('video').forEach(video => video.pause());
  index = 0;
  dialog.showModal();
  document.documentElement.classList.add('tour-active');
  show();
}
function close() { dialog.close(); }
dialog.addEventListener('close', () => {
  document.documentElement.classList.remove('tour-active');
  cancelAnimationFrame(frame);
  window.scrollTo({top:returnScroll, behavior:'instant'});
  returnFocus?.focus({preventScroll:true});
});
dialog.querySelector('[data-tour-close]').addEventListener('click', close);
previous.addEventListener('click', () => {if(index > 0) {index--; show();}});
next.addEventListener('click', () => {if(index < steps.length - 1) {index++; show();} else close();});
// Capture keyboard shortcuts so the underlying search cannot open over a tour.
document.addEventListener('keydown', event => {
  if (!dialog.open) return;
  if (event.key === 'Tab') {
    const controls = [...dialog.querySelectorAll('button:not(:disabled)')];
    const current = controls.indexOf(document.activeElement);
    const nextIndex = current < 0 ? (event.shiftKey ? controls.length - 1 : 0) :
      (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    event.preventDefault();
    controls[nextIndex].focus({preventScroll:true});
  }
  if (event.key === '/') {event.preventDefault(); event.stopImmediatePropagation();}
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); event.stopImmediatePropagation();
    (event.key === 'ArrowRight' ? next : previous).click();
  }
}, true);
window.addEventListener('resize', schedulePosition);
window.addEventListener('scroll', schedulePosition, {passive:true});
window.visualViewport?.addEventListener('resize', schedulePosition);
window.visualViewport?.addEventListener('scroll', schedulePosition);
document.querySelectorAll('[data-start-tour]').forEach(button => button.addEventListener('click', start));
if (new URL(location.href).searchParams.get('tour') === '1') {
  const url = new URL(location.href); url.searchParams.delete('tour');
  history.replaceState(history.state, '', url);
  // Course page modules may mount their controls after a fetch.
  window.addEventListener('load', () => start(), {once:true});
  if (document.readyState === 'complete') start();
}
