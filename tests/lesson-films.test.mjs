import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {G01, BAD, GOOD, exact, metrics, run} from '../site/engines/course.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const load = path => JSON.parse(read(path));
const storyboards = load('video/lessons/storyboards.json');
const media = load('content/media.json');
const catalog = load('content/catalog.json');
const stamp = seconds => new Date(seconds * 1000).toISOString().slice(11, 23);

test('lesson stories use the shared graph and current course results', () => {
  const {graph, films} = storyboards;
  assert.deepEqual(graph, G01);
  const values = (lesson, chapter, beat) =>
    films[lesson].scenes[chapter].beats[beat].view.values.map(row => row.value);
  assert.deepEqual(values('02', 2, 1), [metrics(graph, BAD).cut, metrics(graph, GOOD).cut]);
  assert.deepEqual(values('03', 4, 0), [
    run('initial', graph, {strategy:'random', seed:7}).result.cut,
    run('initial', graph, {strategy:'greedy'}).result.cut,
    run('initial', graph, {strategy:'grow'}).result.cut,
    exact(graph, {k:2, maxDiff:1}).best.cut,
  ]);
  for (const [lesson, method] of [['04','kl'], ['05','fm']]) {
    const {prefix} = run(method, graph).events.find(e => e.kind === 'best-prefix');
    assert.deepEqual(values(lesson, 3, 0), prefix.gains);
    assert.equal(films[lesson].scenes[3].beats[0].view.best, prefix.bestK);
  }
  const splits = run('recursive', graph, {k:3}).events;
  const comparison = values('08', 3, 0);
  assert.deepEqual(comparison, [
    run('multiway', graph, {k:3, capacity:2, strategy:'round-robin'}).result.cut,
    splits.at(-1).metrics.cut,
    run('multiway', graph, {k:3, capacity:2}).result.cut,
  ]);
});

test('all lesson pages link to decoded bilingual films, aligned captions and source material', () => {
  assert.deepEqual(Object.keys(storyboards.films), catalog.map(lesson => lesson.id));
  for (const lesson of catalog) {
    const {id, slug} = lesson;
    const base = 'site/media/lessons/' + id + '/';
    const film = load(base + 'film.json');
    const story = storyboards.films[id];
    const beats = story.scenes.flatMap(scene => scene.beats);
    assert.equal(film.lesson, id);
    assert.equal(film.chapters.length, story.scenes.length);
    assert.equal(film.captions.length, beats.length);
    let cursor = 0;
    for (const [index, caption] of film.captions.entries()) {
      const [zh, en] = caption.text;
      assert.deepEqual(caption.text, beats[index].caption);
      assert.equal(caption.start, cursor);
      const minimum = Math.max(zh.replace(/\s/g, '').length / 4.5, en.length / 15) + .8;
      assert.ok(caption.end - caption.start >= minimum, id + ': ' + en);
      cursor = caption.end;
    }
    assert.equal(cursor, film.duration);
    let firstBeat = 0;
    for (const [index, chapter] of film.chapters.entries()) {
      assert.deepEqual(chapter.title, story.scenes[index].title);
      assert.equal(chapter.time, film.captions[firstBeat].start);
      firstBeat += story.scenes[index].beats.length;
    }
    for (const [path, digest] of Object.entries(film.sourceFiles)) {
      assert.equal(createHash('sha256').update(read(path)).digest('hex'), digest, path);
    }
    for (const lang of ['zh', 'en']) {
      const asset = base + 'lesson.' + lang;
      const {sha256, bytes, frames, decoded, faststart} = film.versions[lang];
      const mp4 = read(asset + '.mp4');
      assert.equal(createHash('sha256').update(mp4).digest('hex'), sha256);
      assert.equal(mp4.length, bytes);
      assert.equal(frames, 30 * film.duration);
      assert.ok(decoded && faststart && bytes < 25_000_000);
      assert.equal(read(asset + '.jpg').readUInt16BE(), 0xffd8);
      const captions = film.captions.map(({start, end, text}) => {
        const line = lang === 'en' ? text[1] : text.join('\n');
        return stamp(start) + ' --> ' + stamp(end) + '\n' + line;
      });
      assert.equal(read(asset + '.vtt').toString().trim(), ['WEBVTT', ...captions].join('\n\n'));
      const prefix = lang === 'en' ? 'en/' : '';
      const page = read(`site/${prefix}modules/${id}-${slug}/index.html`).toString();
      for (const extension of ['mp4', 'jpg', 'vtt', 'md']) {
        assert.ok(page.includes(`media/lessons/${id}/lesson.${lang}.${extension}"`));
      }
      assert.ok(page.includes(lesson.url));
      for (const key of ['video', 'videoEn']) {
        if (media[id][key]) assert.ok(page.includes('href="' + media[id][key] + '"'));
      }
      assert.equal((page.match(/data-home-chapter=/g) || []).length, film.chapters.length);
    }
  }
});
