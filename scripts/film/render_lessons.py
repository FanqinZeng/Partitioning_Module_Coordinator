#!/usr/bin/env python3
"""Render and check the bilingual lesson films with the homepage drawing kit."""

import argparse
import hashlib
import json
import math
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image

from graphics import (
    BG, BLUE, COLORS, FAINT, FPS, GOLD, H, IVORY, MUTED, PANEL, ROSE, TEAL, W,
    background, box, circle, dim, ease, graph, line, mixpos, multiline, text, wrap,
)
from score import synthesize
from validate_intro import atoms

ROOT = Path(__file__).resolve().parents[2]
STORYBOARDS = ROOT / 'video/lessons/storyboards.json'
DATA = json.loads(STORYBOARDS.read_text())
GRAPH = DATA['graph']
CACHE = ROOT / '.cache/lesson-films'
DEST = ROOT / 'site/media/lessons'
QA = ROOT / '.qa/lesson-films'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
TONES = {'muted': MUTED, 'gold': GOLD, 'teal': TEAL, 'blue': BLUE, 'rose': ROSE}
SOURCE_FILES = (
    'scripts/film/export_lesson_data.mjs',
    'scripts/film/render_lessons.py',
    'scripts/film/graphics.py',
    'scripts/film/score.py',
    'video/lessons/storyboards.json',
)


def tr(value, lang):
    return str(value[lang == 'en'] if isinstance(value, list) else value)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def timestamp(seconds):
    ms = round(seconds * 1000)
    minutes, remainder = divmod(ms, 60000)
    whole, millis = divmod(remainder, 1000)
    return f'{minutes//60:02d}:{minutes%60:02d}:{whole:02d}.{millis:03d}'


def timeline(film):
    beats, chapters, music_scenes = [], [], []
    start = 0
    for scene in film['scenes']:
        chapters.append({'time': start, 'title': scene['title']})
        duration = 0
        for beat in scene['beats']:
            zh, en = beat['caption']
            minimum = max(sum(not char.isspace() for char in zh) / 4.5, len(en) / 15) + .8
            hold = max(beat['seconds'], math.ceil(minimum + .3))
            beats.append(dict(beat, title=scene['title'], start=start, end=start + hold))
            duration += hold
            start += hold
        music_scenes.append({'duration': duration, 'chapter': scene['title']})
    return beats, chapters, music_scenes


def place(assignment):
    # Preserve a slot for each side, including an empty side in the validation lesson.
    groups = max(2, max(assignment.values()) + 1)
    pitch = 990 / groups
    positions = {}
    offsets = {
        0: [], 1: [(0, 0)], 2: [(-40, -100), (40, 108)],
        3: [(-76, -118), (72, -30), (-15, 130)],
        4: [(-84, -115), (82, -104), (-82, 114), (82, 122)],
        5: [(-92, -141), (92, -133), (-104, 13), (98, 20), (3, 159)],
    }
    for group in range(groups):
        vertices = sorted(v for v, p in assignment.items() if p == group)
        for vertex, (dx, dy) in zip(vertices, offsets[len(vertices)]):
            positions[vertex] = (125 + (group + .5) * pitch + dx, 548 + dy)
    return positions, pitch, groups


def draw_graph(image, view, previous, elapsed, lang):
    assignment = view['assignment']
    earlier = view.get('from', previous.get('assignment', assignment))
    positions, pitch, groups = place(assignment)
    from_positions, _, _ = place(earlier)
    progress = ease(elapsed / 2)
    moving = earlier != assignment and progress < 1
    positions = {vertex: mixpos(from_positions[vertex], target, progress)
                 for vertex, target in positions.items()}
    for group in range(groups):
        start = 125 + group * pitch
        color = COLORS[group]
        box(image, (start + 10, 328, start + pitch - 10, 783), dim(color, .33), '#0b1c24', 13)
        text(image, tr([f'组 {group}', f'PART {group}'], lang), start + 27, 352, 25, color, 'mono')
    highlights = view.get('focus', [])
    rows = view['rows']
    if view.get('accumulate'):
        count = min(len(rows), int(elapsed / 1.25))
        highlights = view['accumulate'][:count]
        rows = rows[:count]
    graph(image, GRAPH, earlier if moving else assignment, positions, .90,
          highlights, locks=view.get('locks', ()) if not moving else previous.get('locks', ()),
          sizes=view.get('sizes'))
    line(image, (1155, 290), (1155, 797), FAINT, 2)
    if moving:
        text(image, tr(['试探分组变化', 'Changing the assignment'], lang), 1210, 486, 31, GOLD)
        return
    for index, item in enumerate(rows):
        y = 296 + index * 92
        tone = TONES[item['tone']]
        text(image, tr(item['name'], lang), 1210, y, 25, MUTED, max_width=576)
        text(image, tr(item['value'], lang), 1210, y + 32, 36, tone if tone != MUTED else IVORY,
             max_width=576)
        line(image, (1210, y + 80), (1806, y + 80))
    if view.get('accumulate'):
        subtotal = sum(item['value'] for item in rows)
        text(image, tr([f'累计  {subtotal}', f'SUBTOTAL  {subtotal}'], lang),
             1210, 700, 42, GOLD, 'mono')


def draw_cards(image, view, elapsed, lang):
    rows = view['rows']
    text(image, tr(view['heading'], lang), 960, 310, 32, MUTED, 'serif', 'center')
    pitch = 1620 / len(rows)
    for index, item in enumerate(rows):
        x = 150 + index * pitch
        y = 431 + 16 * (1 - ease((elapsed - index * .22) / 1.15))
        tone = TONES[item['tone']]
        box(image, (x + 12, y, x + pitch - 12, y + 255), FAINT, PANEL, 15)
        line(image, (x + 38, y + 34), (x + 118, y + 34), tone, 3)
        text(image, tr(item['name'], lang), x + 38, y + 67, 31, MUTED, max_width=pitch - 77)
        text(image, tr(item['value'], lang), x + 38, y + 142, 44, tone if tone != MUTED else IVORY,
             max_width=pitch - 77)


def draw_chart(image, view, elapsed, lang):
    rows = view['values']
    text(image, tr(view['heading'], lang), 120, 275, 30, MUTED)
    values = [item['value'] for item in rows]
    span = max(abs(value) for value in values) or 1
    origin, width = (920, 510) if min(values) < 0 else (520, 1050)
    spacing = min(104, 418 / len(rows))
    line(image, (origin, 340), (origin, 358 + spacing * len(rows)), FAINT, 2)
    for index, item in enumerate(rows):
        y = 348 + index * spacing
        value = item['value']
        tone = GOLD if index == view['best'] else TONES[item['tone']]
        distance = value / span * width * ease((elapsed - index * .26) / 1.7)
        tip = origin + distance
        if abs(distance) >= 1:
            box(image, (min(origin, tip), y, max(origin, tip), y + 39), None, dim(tone, .74), 5)
        text(image, tr(item['name'], lang), 124, y + 1, 29, IVORY, max_width=348)
        text(image, value, max(origin, tip) + 21, y + 1, 31, tone, 'mono')


def draw_matrix(image, view, elapsed, lang):
    text(image, tr(view['heading'], lang), 315, 397, 40, IVORY, 'serif', 'center')
    text(image, 'L = D − A', 315, 489, 42, GOLD, 'mono', 'center')
    names = view['names']
    for index, label in enumerate(names):
        text(image, label, 798 + index * 135, 286, 28, TEAL, 'mono', 'center')
        text(image, label, 684, 345 + index * 83, 28, TEAL, 'mono', 'center')
    for row_index, values in enumerate(view['values']):
        for col_index, value in enumerate(values):
            x, y = 741 + col_index * 135, 329 + row_index * 83
            tone = GOLD if col_index == row_index else (BLUE if value else MUTED)
            box(image, (x, y, x + 113, y + 68), FAINT, PANEL, 6)
            if elapsed >= row_index * .32 + col_index * .1:
                text(image, value, x + 56, y + 16, 33, tone, 'mono', 'center')
    text(image, tr(['每行和为 0','Each row sums to 0'], lang), 1530, 518, 29, MUTED, max_width=272)


def draw_order(image, view, elapsed, lang):
    names = view['names']
    x_positions = np.linspace(315, 1605, len(names))
    text(image, tr(view['heading'], lang), 960, 325, 34, MUTED, 'serif', 'center')
    line(image, (200, 524), (1720, 524), FAINT, 2, ease(elapsed / 1.3))
    separator = view.get('separator')
    if view.get('sweep'):
        separator = min(len(names) - 1, 1 + int(elapsed / 2))
    for index, (x, name) in enumerate(zip(x_positions, names)):
        if elapsed < .2 * index:
            continue
        color = BLUE if separator and index >= separator else TEAL
        circle(image, (float(x), 524), 53, color, name)
        if view.get('values'):
            text(image, view['values'][index], x, 620, 36, MUTED, 'mono', 'center')
    if separator:
        x = (x_positions[separator - 1] + x_positions[separator]) / 2
        line(image, (x, 426), (x, 700), GOLD, 4)
        text(image, f'k = {separator}', x, 723, 24, GOLD, 'mono', 'center')


DRAW = {'cards': draw_cards, 'chart': draw_chart, 'matrix': draw_matrix, 'order': draw_order}


def frame(lesson, film, beats, index, elapsed, lang):
    beat = beats[index]
    image = background().copy()
    view = beat['view']
    if view['type'] == 'graph':
        previous = beats[index - 1]['view'] if index else {}
        draw_graph(image, view, previous, elapsed, lang)
    else:
        DRAW[view['type']](image, view, elapsed, lang)
    text(image, f'LEARNING PARTITIONING / LESSON {lesson}', 112, 65, 22, TEAL, 'mono')
    text(image, tr(film['title'], lang), 1806, 61, 27, MUTED, 'serif', 'right', 755)
    text(image, tr(beat['title'], lang), 112, 134, 61, IVORY, 'serif', max_width=1680)
    zh, en = beat['caption']
    if lang == 'zh':
        lines = wrap(zh, 44, 1660, 'bold')
        assert len(lines) <= 2, zh
        multiline(image, zh, 960, 897 if len(lines) == 1 else 856, 44, IVORY, 'bold', 1660, 3, 'center')
        text(image, en, 960, 982, 28, MUTED, 'italic', 'center', 1660)
    else:
        lines = wrap(en, 44, 1660, 'sans')
        assert len(lines) <= 2, en
        multiline(image, en, 960, 929 if len(lines) == 1 else 886, 44, IVORY, 'sans', 1660, 9, 'center')
    if index == len(beats) - 1:
        text(image, tr(['原创配乐《边界》 · FanqinZeng', 'Original score: Boundaries · FanqinZeng'], lang),
             1806, 820, 20, MUTED, 'sans', 'right')
        fade = ease((elapsed - (beat['end'] - beat['start'] - .65)) / .65)
        if fade:
            image = Image.blend(image, Image.new('RGB', (W, H), BG), fade)
    return image


def encode(lesson, film, beats, lang, score, output):
    duration = beats[-1]['end']
    command = [FFMPEG, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
               '-s', f'{W}x{H}', '-r', str(FPS), '-i', 'pipe:0', '-i', str(score),
               '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast',
               '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
               '-movflags', '+faststart', '-threads', '4', '-t', str(duration), str(output)]
    with subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE) as process:
        try:
            for index, beat in enumerate(beats):
                frames = (beat['end'] - beat['start']) * FPS
                for n in range(frames):
                    image = frame(lesson, film, beats, index, n / FPS, lang)
                    process.stdin.write(image.tobytes())
            process.stdin.close()
            error = process.stderr.read().decode()
            if process.wait():
                raise RuntimeError(error)
        except BaseException:
            if process.poll() is None:
                process.kill()
            raise


def validate(path, beats):
    duration = beats[-1]['end']
    boxes = atoms(path)
    assert boxes.index('moov') < boxes.index('mdat'), path
    result = subprocess.run([FFMPEG, '-hide_banner', '-xerror', '-i', str(path),
                             '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-',
                             '-progress', 'pipe:1', '-nostats'], capture_output=True,
                            text=True, check=True)
    assert all(item in result.stderr for item in ['1920x1080', 'yuv420p', '30 fps', 'Video: h264', 'Audio: aac'])
    frames = int(re.findall(r'^frame=\s*(\d+)\s*$', result.stdout, re.M)[-1])
    assert frames == duration * FPS and 'progress=end' in result.stdout
    audio = subprocess.check_output([FFMPEG, '-v', 'error', '-i', str(path), '-map', '0:a:0',
                                     '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'])
    samples = np.frombuffer(audio, dtype='<f4')
    peak = float(np.max(np.abs(samples)))
    rms = 20 * math.log10(float(np.sqrt(np.mean(samples.astype(np.float64) ** 2))))
    assert 0 < peak < 1 and -26 < rms < -22
    assert path.stat().st_size < 25_000_000
    return {'sha256': sha(path), 'bytes': path.stat().st_size, 'frames': frames,
            'audioRmsDbFS': round(rms, 3), 'audioPeakDbFS': round(20 * math.log10(peak), 3),
            'decoded': True, 'faststart': True}


def contact_sheet(lesson, film, beats, lang, media=None):
    tile_w, tile_h = 480, 270
    sheet = Image.new('RGB', (tile_w * 2, tile_h * math.ceil(len(beats) / 2)), BG)
    for index, beat in enumerate(beats):
        if media:
            sample = CACHE / f'{lesson}.{lang}.sample.jpg'
            subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', str(beat['start'] + 4),
                            '-i', str(media), '-frames:v', '1', '-vf', 'scale=480:270',
                            str(sample)], check=True)
            with Image.open(sample) as decoded:
                tile = decoded.copy()
        else:
            tile = frame(lesson, film, beats, index, 4, lang).resize((tile_w, tile_h))
        sheet.paste(tile, ((index % 2) * tile_w, (index // 2) * tile_h))
    sheet.save(QA / f'{lesson}.{lang}.jpg', quality=91)


def build_lesson(lesson, film, stills):
    beats, chapters, scenes = timeline(film)
    if stills:
        for lang in ('zh', 'en'):
            contact_sheet(lesson, film, beats, lang)
        return
    score = CACHE / f'{lesson}.wav'
    synthesize({'scenes': scenes}, score)
    directory = DEST / lesson
    directory.mkdir(parents=True, exist_ok=True)
    versions = {}
    for lang in ('zh', 'en'):
        staging = CACHE / f'{lesson}.{lang}.mp4'
        encode(lesson, film, beats, lang, score, staging)
        proof = validate(staging, beats)
        contact_sheet(lesson, film, beats, lang, staging)
        captions = ['WEBVTT', '']
        transcript = ['# ' + tr(film['title'], lang), '']
        for beat in beats:
            zh, en = beat['caption']
            content = zh + '\n' + en if lang == 'zh' else en
            captions.extend([timestamp(beat['start']) + ' --> ' + timestamp(beat['end']), content, ''])
            transcript.extend([timestamp(beat['start']), content, ''])
        (directory / f'lesson.{lang}.vtt').write_text('\n'.join(captions))
        (directory / f'lesson.{lang}.md').write_text('\n'.join(transcript))
        frame(lesson, film, beats, 0, 4, lang).save(directory / f'lesson.{lang}.jpg', quality=94)
        staging.replace(directory / f'lesson.{lang}.mp4')
        versions[lang] = proof
        print(f"{lesson} {lang}: {beats[-1]['end']}s, {proof['frames']} frames decoded, {proof['bytes'] / 1e6:.2f} MB", flush=True)
    metadata = {'lesson': lesson, 'duration': beats[-1]['end'], 'title': film['title'],
                'description': film['description'], 'chapters': chapters,
                'captions': [{'start': b['start'], 'end': b['end'], 'text': b['caption']} for b in beats],
                'sourceFiles': {name: sha(ROOT / name) for name in SOURCE_FILES}, 'versions': versions}
    (directory / 'film.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('lessons', nargs='*')
    parser.add_argument('--stills', action='store_true')
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    for lesson in args.lessons or DATA['films']:
        build_lesson(lesson, DATA['films'][lesson], args.stills)


if __name__ == '__main__':
    main()
