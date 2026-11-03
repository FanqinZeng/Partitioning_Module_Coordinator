"""Data-oriented 2D film drawing. Palette follows Learning Clustering (Su3037).
All graphics are rendered natively at 1920x1080; text is cached, not upscaled.
"""
from functools import lru_cache
from pathlib import Path
import math
import numpy as np
from PIL import Image,ImageDraw,ImageFont

W,H,FPS=1920,1080,30
ROOT=Path(__file__).resolve().parents[2]
FONT_DIR=ROOT/'.cache/film-fonts'
BG='#061219';PANEL='#0b2029';IVORY='#eeeadd';MUTED='#8fa3a3';FAINT='#2a4048'
GOLD='#ddbd78';TEAL='#76cbb5';BLUE='#86a9e0';ROSE='#d99a9a';LILAC='#a18bc0'
COLORS=[TEAL,BLUE,GOLD,LILAC]
FONTS={'sans':'NotoSansSC-Regular.otf','bold':'NotoSansSC-Bold.otf','serif':'NotoSerifSC-Regular.ttf','latin':'Newsreader-Regular.ttf','italic':'Newsreader-Italic.ttf','mono':'JetBrainsMono-Regular.ttf'}

def clamp(x):return max(0,min(1,x))
def ease(x):
 x=clamp(x);return x*x*(3-2*x)
def lerp(a,b,p):return a+(b-a)*p
def mixpos(a,b,p):return (lerp(a[0],b[0],p),lerp(a[1],b[1],p))
def rgb(color):return tuple(int(color[i:i+2],16) for i in (1,3,5))
def dim(color,f=.35):return tuple(round(v*f) for v in rgb(color))
@lru_cache(maxsize=256)
def font(face,size):return ImageFont.truetype(str(FONT_DIR/FONTS[face]),round(size))
def face_for(text,face):
 if face in ('serif','latin','italic'):
  return 'serif' if any(ord(c)>0x2e80 for c in text) else ('latin' if face=='serif' else face)
 if face=='mono' and any(ord(c)>0x2e80 for c in text):return 'sans'
 return face
@lru_cache(maxsize=8192)
def width(text,size,face='sans'):return font(face_for(text,face),size).getlength(str(text))
@lru_cache(maxsize=8192)
def text_sprite(text,size,color,face):
 ft=font(face_for(text,face),size);box=ft.getbbox(text)
 canvas=Image.new('RGBA',(max(1,math.ceil(ft.getlength(text)))+8,max(1,box[3]-box[1])+8))
 ImageDraw.Draw(canvas).text((4,4-box[1]),text,font=ft,fill=color)
 return canvas
def text(im,content,x,y,size=38,color=IVORY,face='sans',anchor='left',max_width=None):
 content=str(content)
 if max_width:
  while width(content,size,face)>max_width and size>20:size-=1
 sprite=text_sprite(content,round(size),color,face)
 if anchor=='center':x-=sprite.width/2
 elif anchor=='right':x-=sprite.width
 im.paste(sprite,(round(x),round(y)),sprite)
 return sprite.height
def wrap(content,size,max_width,face='sans'):
 tokens=list(content) if any(ord(c)>0x2e80 for c in content) else content.split(' ')
 lines=[];line='';separator='' if any(ord(c)>0x2e80 for c in content) else ' '
 for token in tokens:
  candidate=line+(separator if line else '')+token
  if line and width(candidate,size,face)>max_width:lines.append(line);line=token
  else:line=candidate
 if line:lines.append(line)
 return lines
def multiline(im,content,x,y,size=38,color=IVORY,face='sans',max_width=1400,line_gap=14,anchor='left'):
 lines=wrap(str(content),size,max_width,face)
 for line in lines:y+=text(im,line,x,y,size,color,face,anchor)+line_gap
 return y
def line(im,a,b,color=FAINT,width_px=2,progress=1):
 q=mixpos(a,b,clamp(progress));d=ImageDraw.Draw(im);d.line((a,q),fill=color,width=width_px)
def arrow(im,a,b,color=GOLD,width_px=3,progress=1):
 q=mixpos(a,b,clamp(progress));line(im,a,q,color,width_px)
 angle=math.atan2(q[1]-a[1],q[0]-a[0]);length=14
 for delta in (-.55,.55):line(im,q,(q[0]-length*math.cos(angle+delta),q[1]-length*math.sin(angle+delta)),color,width_px)
def dashed(im,a,b,color=FAINT,width_px=2,dash=10):
 length=math.dist(a,b)
 if not length:return
 for p in range(0,round(length),dash*2):line(im,mixpos(a,b,p/length),mixpos(a,b,min(1,(p+dash)/length)),color,width_px)
def box(im,rect,outline=FAINT,fill=PANEL,radius=14,width_px=2):ImageDraw.Draw(im).rounded_rectangle(rect,radius=radius,fill=fill,outline=outline,width=width_px)
def circle(im,pos,r=35,color=TEAL,label=None,locked=False):
 x,y=pos;d=ImageDraw.Draw(im)
 d.ellipse((x-r-5,y-r-5,x+r+5,y+r+5),outline=dim(color,.25),width=6)
 d.ellipse((x-r,y-r,x+r,y+r),fill=PANEL,outline=color,width=3)
 if label is not None:text(im,label,x,y-r*.62,round(r*.95),IVORY,'serif','center')
 if locked:
  lx,ly=x+r,y-r*1.2
  d.arc((lx-8,ly-10,lx+8,ly+8),180,360,fill=GOLD,width=3)
  d.rounded_rectangle((lx-11,ly,lx+11,ly+17),radius=3,fill=GOLD)
def pill(im,content,x,y,color=TEAL,size=28):
 w=width(content,size)+34;h=size+28
 box(im,(x,y,x+w,y+h),outline=dim(color,.5),fill=PANEL,radius=5)
 text(im,content,x+15,y+9,size,color)

@lru_cache(maxsize=1)
def background():
 y,x=np.mgrid[0:H,0:W];r=np.sqrt(((x-W*.58)/(W*.9))**2+((y-H*.35)/(H*1.2))**2);f=np.clip(1-r,0,1)[...,None]
 a=np.array(rgb(BG));b=np.array(rgb('#0b1f29'))
 arr=(a+(b-a)*f).astype(np.uint8);im=Image.fromarray(arr,'RGB')
 d=ImageDraw.Draw(im)
 for i in range(8):
  xx=80+i*24;d.line((xx,0,xx,32+i*9,160+i*10,32+i*9),fill='#10252d',width=1)
 d.line((110,227,1810,227),fill=FAINT,width=1)
 shade=ImageDraw.Draw(im,'RGBA')
 for yy in range(848,H):shade.line((0,yy,W,yy),fill=(0,5,9,round(170*(yy-848)/(H-848))))
 return im

def graph(im,g,assignment,positions,scale=1,highlight=None,edge_progress=1,locks=(),sizes=None,labels=True):
 highlight=set(highlight or [])
 for idx,e in enumerate(g['edges']):
  u,v,w=e['u'],e['v'],e['w'];a,b=positions[u],positions[v]
  p=clamp(edge_progress*len(g['edges'])-idx)
  if not p:continue
  crossing=assignment[u]!=assignment[v];key=u+v
  color=GOLD if key in highlight else ROSE if crossing else '#547275'
  line(im,a,b,dim(color,.22),max(2,round(10*scale)),p)
  if crossing:dashed(im,a,mixpos(a,b,p),color,max(1,round(2.2*scale)),round(9*scale))
  else:line(im,a,b,color,max(1,round(2*scale)),p)
  if labels and p>.95:
   x,y=mixpos(a,b,.5);r=20*scale
   box(im,(x-r,y-r,x+r,y+r),outline=None,fill='#0b1c24',radius=5)
   text(im,str(w),x,y-r*.85,round(29*scale),GOLD if key in highlight else MUTED,'mono','center')
 for n in g['nodes']:
  node=n['id'];r=34*scale*math.sqrt((sizes or {}).get(node,1))
  circle(im,positions[node],r,COLORS[assignment[node]%len(COLORS)],node,node in locks)

def grouped_positions(assignment,left=420,right=880,cy=520):
 groups=[[n for n in sorted(assignment) if assignment[n]==p] for p in (0,1)]
 layouts={1:[(0,0)],2:[(-45,-115),(80,145)],3:[(-90,-160),(100,-45),(-45,160)]}
 out={}
 for p,members in enumerate(groups):
  offsets=layouts.get(len(members),[(-70+35*(i%3),-170+i*75) for i in range(len(members))])
  for node,(x,y) in zip(members,offsets):out[node]=((left if p==0 else right)+x,cy+y)
 return out
def group_names(a):return ' | '.join(''.join(n for n in sorted(a) if a[n]==p) for p in sorted(set(a.values())))
