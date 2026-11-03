"""Boundaries: original procedural score for the Partitioning introduction.
No external recording or sample. New score and recording: CC BY 4.0.
"""
import json
import math
from pathlib import Path
import wave
import numpy as np

SR=48000
def hz(midi):return 440*2**((midi-69)/12)
def synthesize(story,out):
 duration=sum(s['duration'] for s in story['scenes']);n=round(duration*SR)
 music=np.zeros(n,dtype=np.float64);cues=[];cursor=0
 chords=[(50,57,62,65),(46,53,58,62),(53,60,65,69),(48,55,60,64)]
 # Long, overlapping chords follow the chapter-level structure, not every picture edit.
 chapters=[]
 for scene in story['scenes']:
  if 'chapter'in scene:chapters.append(cursor)
  cursor+=scene['duration']
 chapters.append(duration)
 for i,start in enumerate(chapters[:-1]):
  end=min(duration,chapters[i+1]+2);a=round(start*SR);b=round(end*SR);t=np.arange(b-a)/SR;length=end-start
  env=np.minimum(1,t/2.0)*np.minimum(1,(length-t)/2.5)
  chord=chords[i%len(chords)]
  for j,note in enumerate(chord):
   freq=hz(note);voice=np.sin(2*np.pi*freq*t+j*.3)+.13*np.sin(2*np.pi*freq*2*t+.4)
   music[a:b]+=env*voice*(.09 if j else .12)
  cues.append({'time':start,'kind':'chapter-chord','notes':list(chord)})
 # A restrained plucked motif. Four notes leave space for reading.
 motif=[74,69,65,69,72,69,65,62];beat=60/72
 for i,start in enumerate(np.arange(3,duration-5,beat*2)):
  if int(start)%16>=9:continue
  a=round(start*SR);b=min(n,a+round(2.6*SR));t=np.arange(b-a)/SR;note=motif[i%len(motif)]
  env=(1-np.exp(-t*70))*np.exp(-t*2.4)
  music[a:b]+=.048*env*(np.sin(2*np.pi*hz(note)*t)+.2*np.sin(2*np.pi*hz(note)*3*t))
  cues.append({'time':round(float(start),6),'kind':'plucked-note','midi':note})
 # Quiet transient on selected narrative changes, with an actual PCM event time.
 for start in [24,46,60,74,98,110,124,148,160,180]:
  a=round(start*SR);b=min(n,a+SR);t=np.arange(b-a)/SR
  music[a:b]+=.022*(1-np.exp(-t*120))*np.exp(-t*7)*np.sin(2*np.pi*(hz(86)*t-35*t*t))
  cues.append({'time':start,'kind':'narrative-accent'})
 fade_in=np.minimum(1,np.arange(n)/(SR*1.2));fade_out=np.minimum(1,(n-1-np.arange(n))/(SR*3))
 music*=fade_in*fade_out
 target=10**(-24/20);music*=target/(np.sqrt(np.mean(music**2))+1e-12)
 peak=float(np.max(np.abs(music)));assert peak<.9
 pcm=np.round(music*32767).astype('<i2')
 with wave.open(str(out),'wb') as wav:wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(SR);wav.writeframes(pcm.tobytes())
 actual=pcm.astype(np.float64)/32767
 # Analyse the rendered PCM rather than infer its level from synthesis settings.
 report={'title':'Boundaries / 边界','sampleRate':SR,'duration':duration,'rmsDbFS':round(20*math.log10(float(np.sqrt(np.mean(actual**2)))) ,3),'peakDbFS':round(20*math.log10(float(np.max(np.abs(actual)))) ,3),'clippedSamples':int(np.sum(np.abs(pcm.astype(np.int32))>=32767)), 'events':sorted(cues,key=lambda c:c['time'])}
 Path(out).with_suffix('.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 return report
