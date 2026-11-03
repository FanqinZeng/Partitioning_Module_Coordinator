#!/usr/bin/env python3
"""Render the original bilingual home film, contact sheets and review samples.

python scripts/film/render_intro.py --stills
python scripts/film/render_intro.py --sample 60 98 --lang zh
python scripts/film/render_intro.py --lang both
Dependencies: Pillow, NumPy, imageio-ffmpeg; fonts: fetch_fonts.py.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

from PIL import Image,ImageDraw
import imageio_ffmpeg
from graphics import *
from score import synthesize

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
HOME=ROOT/'video/home'
STORY=json.loads((HOME/'storyboard.json').read_text())
spec=importlib.util.spec_from_file_location('home_scenes',HOME/'scenes.py');scenes=importlib.util.module_from_spec(spec);spec.loader.exec_module(scenes)
DEST=ROOT/'site/media/home'
QA=ROOT/'.qa/intro'
CACHE=ROOT/'.cache/film'
DURATION=sum(s['duration'] for s in STORY['scenes'])
TIMELINE=[];CAPTIONS=[];cursor=0
for scene in STORY['scenes']:
 assert sum(b[0] for b in scene['beats'])==scene['duration'],scene['id']
 TIMELINE.append({**scene,'start':cursor,'end':cursor+scene['duration']})
 beat_start=cursor
 for duration,zh,en in scene['beats']:
  minimum=max(sum(not c.isspace() for c in zh)/4.5,len(en.strip())/15)+.8
  assert duration+1e-9>=minimum,(scene['id'],duration,minimum)
  CAPTIONS.append({'start':beat_start,'end':beat_start+duration,'zh':zh,'en':en,'minimum':round(minimum,4),'scene':scene['id']})
  beat_start+=duration
 cursor+=scene['duration']
assert DURATION==190 and len(TIMELINE)==16 and len(CAPTIONS)==30

def timestamp(seconds,sep='.'):
 ms=round(seconds*1000);s,ms=divmod(ms,1000);m,s=divmod(s,60);h,m=divmod(m,60)
 return f'{h:02}:{m:02}:{s:02}{sep}{ms:03}'

def render_frame(absolute,lang):
 absolute=max(0,min(DURATION-.000001,absolute))
 idx=next(i for i,s in enumerate(TIMELINE) if s['start']<=absolute<s['end']);scene=TIMELINE[idx];local=absolute-scene['start']
 im=background().copy()
 scenes.DRAW[scene['id']](im,local,lang)
 text(im,'LEARNING PARTITIONING / INTRODUCTION',112,64,22,TEAL,'mono')
 text(im,f'{idx+1:02} / 16',1806,64,22,MUTED,'mono','right')
 if scene['id']!='title':text(im,scenes.tr(scene['title'],lang),112,132,62,IVORY,'serif',max_width=1695)
 # Captions stay fixed while explanatory objects move. A soft shade creates separation.
 current=next(c for c in CAPTIONS if c['start']<=absolute<c['end'])
 if lang=='zh':
  lines=wrap(current['zh'],44,1695,'bold');assert len(lines)<=2,current
  top=904 if len(lines)==1 else 873
  multiline(im,current['zh'],960,top,44,IVORY,'bold',1695,10,'center')
  multiline(im,current['en'],960,985,28,MUTED,'italic',1695,7,'center')
 else:
  lines=wrap(current['en'],44,1695,'sans');assert len(lines)<=2,current
  multiline(im,current['en'],960,920 if len(lines)==1 else 890,44,IVORY,'sans',1695,12,'center')
 if absolute>DURATION-.8:
  fade=Image.new('RGB',(W,H),'#061219');im=Image.blend(im,fade,ease((absolute-(DURATION-.8))/.8))
 return im

def stills():
 QA.mkdir(parents=True,exist_ok=True)
 for lang in ['zh','en']:
  # One representative frame per scene. Separate edge/middle/exit frames below.
  contact=Image.new('RGB',(W,H*4),'#061219')
  for i,s in enumerate(TIMELINE):
   image=render_frame(s['start']+s['duration']*.7,lang)
   image.save(QA/f"{i+1:02}-{s['id']}.{lang}.jpg",quality=93)
   tile=image.resize((W//2,H//2),Image.Resampling.LANCZOS)
   contact.paste(tile,((i%2)*(W//2),(i//2)*(H//2)))
  contact.save(QA/f'contact.{lang}.jpg',quality=94)
  # Preserve review frames for the three phases of each scene.
  for i,s in enumerate(TIMELINE):
   for phase,at in [('entry',.5),('middle',s['duration']/2),('exit',s['duration']-.5)]:
    render_frame(s['start']+at,lang).resize((960,540),Image.Resampling.LANCZOS).save(QA/f"check-{i+1:02}-{phase}.{lang}.jpg",quality=90)
 print('Contact sheets and entry/middle/exit review frames:',QA,flush=True)

def write_text_outputs(lang):
 DEST.mkdir(parents=True,exist_ok=True)
 cues=['WEBVTT','']
 transcript=['# '+scenes.tr(STORY['title'],lang),'']
 for i,c in enumerate(CAPTIONS,1):
  content=c['zh']+'\n'+c['en'] if lang=='zh' else c['en']
  cues.extend([str(i),timestamp(c['start'])+' --> '+timestamp(c['end']),content,''])
  transcript.extend([f"{timestamp(c['start'])} — {timestamp(c['end'])}",content,''])
 (DEST/f'intro.{lang}.vtt').write_text('\n'.join(cues))
 (DEST/f'intro.{lang}.md').write_text('\n'.join(transcript))
 render_frame(27,lang).save(DEST/f'intro.{lang}.jpg',quality=95)

def metadata(music_report):
 data=scenes.DATA
 sources=['video/home/storyboard.json','video/home/scenes.py','video/home/data.json','scripts/film/graphics.py','scripts/film/score.py','scripts/film/render_intro.py','scripts/film/export_intro_data.mjs']
 payload={'schema':2,'id':'home-intro','version':'2026-11-03-1','duration':DURATION,'width':W,'height':H,'fps':FPS,
 'title':{'zh':STORY['title'][0],'en':STORY['title'][1]},'why':{'zh':STORY['why'][0],'en':STORY['why'][1]},
 'music':{**STORY['music'],'analysis':{k:v for k,v in music_report.items() if k!='events'}},
 'graphDigest':data['graphDigest'],'sourceDataSha256':hashlib.sha256((HOME/'data.json').read_bytes()).hexdigest(),
 'sourceFiles':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in sources},
 'readingViolations':{'zh':0,'en':0},'captions':CAPTIONS,
 'chapters':[{'time':s['start'],'title':{'zh':s['chapter'][0],'en':s['chapter'][1]}} for s in TIMELINE if 'chapter'in s],
 'scenes':[{'id':s['id'],'start':s['start'],'end':s['end'],'title':s['title']} for s in TIMELINE],
 'versions':{lang:{'video':f'intro.{lang}.mp4','poster':f'intro.{lang}.jpg','captions':f'intro.{lang}.vtt','transcript':f'intro.{lang}.md','duration':DURATION,'sha256':hashlib.sha256((DEST/f'intro.{lang}.mp4').read_bytes()).hexdigest()} for lang in ['zh','en']}}
 (DEST/'film.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')

def encode(lang,start,end,output):
 ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();score=CACHE/'boundaries.wav'
 duration=end-start;frames=round(duration*FPS)
 command=[ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-ss',str(start),'-i',str(score),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-threads','4','-t',str(duration),str(output)]
 process=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 began=time.monotonic();next_log=began+10
 try:
  for frame in range(frames):
   process.stdin.write(render_frame(start+frame/FPS,lang).tobytes())
   now=time.monotonic()
   if now>=next_log:
    print(f'{lang}: {frame+1}/{frames} frames, {(frame+1)/(now-began):.1f} fps',flush=True);next_log=now+10
  process.stdin.close();error=process.stderr.read().decode();code=process.wait()
  if code:raise RuntimeError(error)
 except Exception:
  process.kill();raise
 print(f'Rendered {output.name}: {duration}s, {output.stat().st_size/1e6:.2f} MB in {time.monotonic()-began:.1f}s',flush=True)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--stills',action='store_true');parser.add_argument('--sample',nargs=2,type=float);parser.add_argument('--lang',choices=['zh','en','both'],default='both');args=parser.parse_args()
 CACHE.mkdir(parents=True,exist_ok=True);DEST.mkdir(parents=True,exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
 score=CACHE/'boundaries.wav'
 if not score.exists():music_report=synthesize(STORY,score)
 else:music_report=json.loads(score.with_suffix('.json').read_text())
 if args.stills:stills();return
 langs=['zh','en'] if args.lang=='both' else [args.lang]
 for lang in langs:
  if not args.sample:write_text_outputs(lang)
  if args.sample:
   start,end=args.sample;assert 0<=start<end<=DURATION
   output=QA/f'intro-sample-{int(start)}-{int(end)}.{lang}.mp4'
  else:start,end=0,DURATION;output=DEST/f'intro.{lang}.mp4'
  encode(lang,start,end,output)
 if not args.sample and args.lang=='both':metadata(music_report)
if __name__=='__main__':main()
