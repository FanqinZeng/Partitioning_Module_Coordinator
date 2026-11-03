#!/usr/bin/env python3
"""Validate delivered video files, not only the storyboard or source render."""
from pathlib import Path
import hashlib
import json
import math
import re
import struct
import subprocess
import sys

import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
MEDIA=ROOT/'site/media/home'
QA=ROOT/'.qa/intro'
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()

def atoms(path):
    result=[]
    with path.open('rb') as stream:
        while True:
            header=stream.read(8)
            if not header:break
            size,kind=struct.unpack('>I4s',header);offset=8
            if size==1:size=struct.unpack('>Q',stream.read(8))[0];offset=16
            assert size>=offset,(path,size,kind)
            result.append(kind.decode('ascii'));stream.seek(size-offset,1)
    return result

def main():
    film=json.loads((MEDIA/'film.json').read_text());report={'duration':film['duration'],'reviewScope':'Bilingual scene contact sheets plus sampled encoded frames; complete decode. Not a claim of full human playback.','versions':{}}
    for lang in ['zh','en']:
        path=MEDIA/f'intro.{lang}.mp4';sha=hashlib.sha256(path.read_bytes()).hexdigest();assert sha==film['versions'][lang]['sha256']
        boxes=atoms(path);assert boxes.index('moov')<boxes.index('mdat')
        command=[FFMPEG,'-hide_banner','-i',str(path),'-map','0:v:0','-map','0:a:0','-f','null','-','-progress','pipe:1','-nostats']
        decode=subprocess.run(command,capture_output=True,text=True,check=True)
        log=decode.stderr
        assert '1920x1080'in log and 'yuv420p'in log and re.search(r'\b30 fps\b',log)
        assert 'Video: h264'in log and 'Audio: aac'in log
        frames=int(re.findall(r'^frame=(\d+)$',decode.stdout,re.M)[-1]);assert frames==190*30
        assert 'progress=end'in decode.stdout
        audio=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','pipe:1'],capture_output=True,check=True)
        samples=np.frombuffer(audio.stdout,dtype='<f4');rms=float(np.sqrt(np.mean(samples.astype(np.float64)**2)));peak=float(np.max(np.abs(samples)))
        assert 0<peak<1 and -26<20*math.log10(rms)<-22
        vtt=(MEDIA/f'intro.{lang}.vtt').read_text();assert vtt.count(' --> ')==len(film['captions'])==30
        assert film['readingViolations'][lang]==0
        for caption in film['captions']:
            minimum=max(sum(not c.isspace() for c in caption['zh'])/4.5,len(caption['en'].strip())/15)+.8
            assert caption['end']-caption['start']>=minimum
        # Review samples from the actual H.264 files, including mid-transition and the end card.
        for time in [3,18,27,42,55,63,69,77,83,91,105,120,132,140,146,155,168,176,186]:
            destination=QA/f'encoded-{time:03}.{lang}.jpg'
            subprocess.run([FFMPEG,'-v','error','-y','-ss',str(time),'-i',str(path),'-frames:v','1','-q:v','2',str(destination)],check=True)
        report['versions'][lang]={'sha256':sha,'bytes':path.stat().st_size,'fullDecode':True,'frames':frames,'width':1920,'height':1080,'fps':30,'faststart':True,'videoCodec':'h264','audioCodec':'aac','audioRmsDbFS':round(20*math.log10(rms),3),'audioPeakDbFS':round(20*math.log10(peak),3),'readingViolations':0,'vttCues':30,'sampledEncodedFrames':19}
        print(lang,'full decode, 5700 frames, H.264/AAC, faststart, captions and audio PASS',flush=True)
    for relative,sha in film['sourceFiles'].items():assert hashlib.sha256((ROOT/relative).read_bytes()).hexdigest()==sha,relative
    (ROOT/'video/home/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Delivered film validation PASS')

if __name__=='__main__':main()
