"""Sixteen scenes for the original Partitioning home introduction.
Visual examples read the course's engine outputs exported by export_intro_data.mjs.
"""
import json
import math
from pathlib import Path
from PIL import ImageDraw
from graphics import *

DATA=json.loads((Path(__file__).parent/'data.json').read_text())
G=DATA['graph'];BAD=DATA['bad'];GOOD=DATA['good']
assert DATA['badMetrics']['cut']==12 and DATA['goodMetrics']['cut']==3
assert DATA['areaMetrics']['areas']==[6,2] and not DATA['areaMetrics']['feasible']
assert DATA['allOneMetrics']['cut']==0 and not DATA['allOneMetrics']['feasible']
assert DATA['initial']['result']['metrics']['cut']==5
assert DATA['kl']['result']['passes'][0]['prefixGains']==[0,9,1]
assert [m['node'] for m in DATA['fm']['result']['passes'][0]['moves'][:2]]==['D','A']
assert DATA['spectral']['result']['order']==list('EDCBA')
assert [s['cut'] for s in DATA['spectral']['result']['sweep']]==[6,3,5,6]
assert [e['metrics']['cut'] for e in DATA['recursive']['events']]==[0,3,8]
assert DATA['roundRobin']['result']['metrics']['cut']==18
assert DATA['refined']['result']['metrics']['cut']==DATA['oracle']['best']['cut']==8
assert int(DATA['counts']['unlabeled5'])==(2**5-2)//2==15
assert int(DATA['counts']['balanced5'])==math.comb(5,2)==10
assert int(DATA['counts']['unlabeled100'])==(2**100-2)//2
assert len(DATA['counts']['unlabeled100'])==30

def tr(pair,lang):return pair[lang=='en']
def pair(zh,en,lang):return en if lang=='en' else zh
def fnum(x):return str(round(x)) if x==round(x) else f'{x:.3g}'
def shifted(positions,x=0,y=0,scale=1):return {n:(xx*scale+x,yy*scale+y) for n,(xx,yy) in positions.items()}
def split_decoration(im,a,left=420,right=880,top=280,bottom=790):
 dashed(im,((left+right)/2,top+45),((left+right)/2,bottom-15),'#5a6260',2,9)
 text(im,' / '.join(n for n in sorted(a) if a[n]==0),left,top,28,TEAL,'mono','center')
 text(im,' / '.join(n for n in sorted(a) if a[n]==1),right,top,28,BLUE,'mono','center')
def metric(im,caption,value,x=1500,y=510,color=GOLD,size=110):
 text(im,caption,x,y-70,30,MUTED,'sans','center')
 text(im,fnum(value),x,y,size,color,'serif','center')

def teams(im,t,lang):
 boxes=[(180,335,825,745),(1095,335,1740,745)]
 for i,rect in enumerate(boxes):
  box(im,rect,COLORS[i],PANEL,18,2)
  text(im,pair('小组','Team',lang)+f' {i+1}',(rect[0]+rect[2])/2,355,36,COLORS[i],'serif','center')
 original={n:(420+i*260,520) for i,n in enumerate('ABCDE')}
 target={'A':(360,485),'B':(630,590),'C':(490,675),'D':(1280,485),'E':(1530,650)}
 p=ease((t-1)/3);positions={n:mixpos(original[n],target[n],p) for n in original}
 for u,v in [('A','B'),('A','C'),('B','C'),('C','D'),('D','E')]:line(im,positions[u],positions[v],FAINT,2)
 for n,point in positions.items():
  circle(im,point,36,COLORS[0 if n in 'ABC' else 1],n)
 text(im,pair('工作分配示意','Illustrative work assignment',lang),960,785,25,MUTED,'sans','center')

def capacity(im,t,lang):
 phase=ease((t-2)/3)
 for i,x in enumerate([170,1080]):
  box(im,(x,330,x+670,690),COLORS[i],PANEL)
  text(im,pair('容量 3','Capacity 3',lang),x+335,350,32,COLORS[i],'sans','center')
 positions0={'A':(300,470),'B':(530,470),'C':(720,600),'D':(1270,470),'E':(1530,600)}
 positions1={n:(300+i*100,500+(i%2)*90) for i,n in enumerate('ABCDE')}
 for n in 'ABCDE':circle(im,mixpos(positions0[n],positions1[n],phase),32,TEAL if phase>.8 or n in 'ABC' else BLUE,n)
 bar_x=250;bar_y=738;scale=95
 box(im,(bar_x,bar_y,bar_x+5*scale,bar_y+28),None,'#162f36',4)
 ImageDraw.Draw(im).rounded_rectangle((bar_x,bar_y,bar_x+lerp(3,5,phase)*scale,bar_y+28),radius=4,fill=ROSE if phase>.1 else TEAL)
 line(im,(bar_x+3*scale,bar_y-12),(bar_x+3*scale,bar_y+42),GOLD,3)
 text(im,'3',bar_x+3*scale,bar_y+40,25,GOLD,'mono','center')
 text(im,pair('负载 5 > 容量 3','Load 5 > capacity 3',lang),1120,710,40,ROSE)
 text(im,pair('cut = 0，却不可行','cut = 0, yet infeasible',lang),1120,775,30,MUTED)

def title(im,t,lang):
 p=ease(t/2)
 text(im,'LEARNING PARTITIONING',960,330,32,TEAL,'mono','center')
 content=pair('划分与取舍','Partition with Purpose',lang)
 text(im,content,960,440,116 if lang=='zh' else 112,IVORY,'serif','center',1700)
 y=630
 line(im,(lerp(960,330,p),y),(lerp(960,1590,p),y),GOLD,2)
 text(im,pair('目标 · 约束 · 决策','Objective · Constraints · Decisions',lang),960,682,36,MUTED,'sans','center')

def chip(im,t,lang):
 rect=(520,280,1400,775);box(im,rect,'#607577','#0a1b23',22,3)
 for i in range(13):
  xx=560+i*65;line(im,(xx,260),(xx,280),MUTED,3);line(im,(xx,775),(xx,795),MUTED,3)
 for i in range(6):
  yy=320+i*80;line(im,(500,yy),(520,yy),MUTED,3);line(im,(1400,yy),(1420,yy),MUTED,3)
 positions={i:(590+(i%6)*145,350+(i//6)*110) for i in range(24)}
 regions={i:0 if i%6<3 else 1 for i in range(24)}
 paths=[(0,1),(1,7),(6,7),(7,8),(8,14),(12,13),(13,14),(18,19),(19,20),(3,4),(4,5),(3,9),(9,10),(10,11),(15,16),(16,17),(21,22),(22,23),(2,3),(8,9),(14,15),(20,21)]
 for j,(a,b) in enumerate(paths):
  p=clamp(t/4-j*.035);cross=regions[a]!=regions[b]
  if cross and t>5:dashed(im,positions[a],positions[b],ROSE,3)
  else:line(im,positions[a],positions[b],FAINT if cross else '#4f706f',2,p)
 for i,(x,y) in positions.items():
  box(im,(x-30,y-23,x+30,y+23),COLORS[regions[i]],'#102831',6)
 if t>3:dashed(im,(955,300),(955,750),GOLD,2,10)
 text(im,pair('示意电路 · edge-cut 简化模型','Illustrative circuit · simplified edge-cut model',lang),960,805,25,MUTED,'sans','center')

def graph_intro(im,t,lang):
 pos={'A':(310,365),'B':(720,340),'C':(550,540),'D':(880,730),'E':(330,735)}
 graph(im,G,BAD,pos,edge_progress=ease((t-1)/5))
 text(im,'G01',1490,350,72,GOLD,'serif','center')
 text(im,pair('5 个节点','5 vertices',lang),1490,465,43,IVORY,'sans','center')
 text(im,pair('6 条无向边','6 undirected edges',lang),1490,545,37,MUTED,'sans','center')
 text(im,pair('默认单位面积','Unit areas by default',lang),1490,630,30,MUTED,'sans','center')

def cut(im,t,lang):
 pos=grouped_positions(BAD);cross=DATA['badMetrics']['cutEdges'];step=min(len(cross),max(0,int((t-.8)/1.2)))
 active=int((t-.8)/1.2) if t>=.8 else -1
 selected=[e['u']+e['v'] for e in cross[:min(len(cross),step+1)]] if t>=.8 else []
 split_decoration(im,BAD)
 graph(im,G,BAD,pos,highlight=selected)
 text(im,pair('跨组边','Crossing edges',lang),1490,290,34,MUTED,'sans','center')
 for i,e in enumerate(cross):
  color=GOLD if i<step else FAINT;y=355+i*77
  text(im,e['u']+'–'+e['v'],1300,y,35,color,'sans')
  text(im,str(e['w']),1635,y,38,color,'mono','right')
  if i==active:
   p=clamp((t-.8-i*1.2)/1.2);point=mixpos(pos[e['u']],pos[e['v']],p)
   ImageDraw.Draw(im).ellipse((point[0]-6,point[1]-6,point[0]+6,point[1]+6),fill=GOLD)
 line(im,(1240,680),(1730,680),FAINT,2)
 metric_name='cut' if step==len(cross) else pair('累计','Subtotal',lang)
 text(im,metric_name+' = '+str(sum(e['w'] for e in cross[:step])),1490,713,70,GOLD,'serif','center')

def better(im,t,lang):
 before=grouped_positions(BAD);after=grouped_positions(GOOD);p=ease((t-1)/3);a=BAD if p<1 else GOOD
 positions={n:mixpos(before[n],after[n],p) for n in before}
 split_decoration(im,GOOD if p>.8 else BAD)
 graph(im,G,a,positions)
 text(im,'12',1390,410,92,MUTED,'serif','center')
 arrow(im,(1460,465),(1575,465),GOLD,3,p)
 if p>.8:text(im,'3',1660,400,116,GOLD,'serif','center')
 text(im,pair('相同的二 / 三人数','Same two / three counts',lang),1510,590,36,IVORY,'sans','center',570)
 text(im,'ABC | DE',1510,680,40,TEAL,'mono','center')

def area(im,t,lang):
 p=ease((t-1)/3);size=lerp(1,4,p);pos=grouped_positions(GOOD,left=350,right=820,cy=530)
 graph(im,G,GOOD,pos,scale=.9,sizes={'A':size})
 x=1160;bar_w=520;scale=bar_w/7
 text(im,pair('面积容量 = 4','Area capacity = 4',lang),1430,300,36,GOLD,'sans','center')
 for i,(label,value) in enumerate([('ABC',lerp(3,6,p)),('DE',2)]):
  y=430+i*180
  text(im,label,x,y-55,34,COLORS[i],'mono')
  box(im,(x,y,x+bar_w,y+55),None,'#162e35',5)
  box(im,(x,y,x+value*scale,y+55),None,ROSE if value>4 else COLORS[i],5)
  line(im,(x+4*scale,y-15),(x+4*scale,y+75),GOLD,3)
  text(im,fnum(value),x+bar_w+40,y-5,52,ROSE if value>4 else IVORY,'serif')
 text(im,pair('人数不变：3 / 2','Counts unchanged: 3 / 2',lang),1430,765,31,MUTED,'sans','center')

def all_splits():
 ids=[n['id'] for n in G['nodes']];out=[]
 for mask in range(1,16):
  a={ids[0]:0};a.update({n:(mask>>(i-1))&1 for i,n in enumerate(ids[1:],1)})
  counts=[sum(p==side for p in a.values()) for side in (0,1)]
  out.append((a,min(counts)==2))
 return out

def enumerate_splits(im,t,lang):
 filtered=t>=7
 text(im,'10' if filtered else '15',960,265,76,GOLD,'serif','center')
 text(im,pair('固定人数二与三' if filtered else '非空，忽略左右命名','Counts fixed to two and three' if filtered else 'Nonempty; side names ignored',lang),960,365,30,MUTED,'sans','center')
 for i,(a,legal) in enumerate(all_splits()):
  x=135+(i%5)*335;y=438+(i//5)*118
  active=(not filtered or legal) and t>.3+i*.06;color=TEAL if active else FAINT
  box(im,(x,y,x+305,y+98),color,PANEL,7)
  for j,n in enumerate('ABCDE'):
   cx=x+40+j*53;cy=y+25;d=ImageDraw.Draw(im);c=COLORS[a[n]] if active else FAINT
   d.ellipse((cx-8,cy-8,cx+8,cy+8),fill=c)
  text(im,group_names(a),x+152,y+55,22,color,'mono','center')

def scale(im,t,lang):
 choices=[5,10,20,100];i=min(3,int(t/2.4));n=choices[i];value=str(2**(n-1)-1)
 for j in range(100):
  x=210+(j%10)*39;y=390+(j//10)*36;d=ImageDraw.Draw(im)
  d.ellipse((x-6,y-6,x+6,y+6),fill=TEAL if j<n else '#20343b')
 text(im,'n = '+str(n),390,275,62,IVORY,'mono','center')
 text(im,'2^(n−1) − 1',1240,340,62,GOLD,'sans','center')
 text(im,value,1220,490,62,IVORY,'mono','center',1060)
 if n==100:text(im,pair('三十位数','30 digits',lang),1240,615,47,ROSE,'serif','center')
 text(im,pair('非空、无标号二分；未加平衡约束','Nonempty, unlabeled splits, before balance constraints',lang),960,785,28,MUTED,'sans','center')

def initial(im,t,lang):
 columns=[(155,pair('随机','Random',lang)),(750,pair('贪心','Greedy',lang)),(1330,pair('生长','Growing',lang))]
 for x,name in columns:
  text(im,name,x+210,300,52,IVORY,'serif','center')
  line(im,(x,380),(x+420,380),FAINT,2)
 random_order=DATA['initialRandom']['events'][0]['order']
 text(im,'seed = 7',365,450,32,BLUE,'mono','center')
 for i,n in enumerate('ABCDE'):
  x=lerp(205+i*76,205+random_order.index(n)*76,ease((t-.5)/2));y=590
  box(im,(x-25,y-35,x+25,y+35),BLUE,PANEL,7);text(im,n,x,y-23,35,IVORY,'serif','center')
 text(im,'cut '+str(DATA['initialRandom']['result']['metrics']['cut']),365,730,33,BLUE,'mono','center')
 circle(im,(870,530),37,TEAL,'A');arrow(im,(925,530),(1050,530),GOLD,3,ease(t/3));circle(im,(1110,530),37,TEAL,'B')
 text(im,pair('选合法的较小增量','Choose a legal lower increment',lang),970,650,28,MUTED,'sans','center',490)
 # Initial growing candidate scores come directly from its first grow event.
 event=DATA['initial']['events'][1]
 for i,c in enumerate(event['candidates']):
  y=430+i*80;color=GOLD if c['node']==event['chosen'] else MUTED
  text(im,c['node'],1320,y-7,33,color,'mono')
  amount=c['score']*52*ease((t-.6)/2)
  if amount>0:box(im,(1380,y,1380+amount,y+28),None,color,4)
  text(im,str(c['score']),1740,y-9,32,color,'mono','right')
 circle(im,(1330,740),23,TEAL,'A')
 circle(im,(lerp(1760,1400,ease((t-3)/2)),740),23,GOLD,'B')
 text(im,'AB | CDE  ·  cut 5',1540,775,30,TEAL,'mono','center')

def refine(im,t,lang):
 left=DATA['kl']['events'];right=DATA['fm']['events']
 # Follow the actual first pass, then its accepted prefix. FM displays its retained prefix.
 if t<3:ki=0;fi=0;phase=0
 elif t<6:ki=1;fi=1;phase=1
 elif t<9:ki=2;fi=2;phase=2
 else:ki=3;fi=next(i for i,e in enumerate(right) if e['kind']=='best-prefix');phase=3
 for col,(label,events,index,xoff) in enumerate([('KL',left,ki,20),('FM',right,fi,960)]):
  event=events[index];a=event['assignment'];target=grouped_positions(a,left=330,right=780,cy=520)
  positions=shifted(target,xoff,160,.72)
  text(im,label,480+xoff,290,62,COLORS[col],'serif','center')
  if index and event.get('before'):
   old=shifted(grouped_positions(event['before'],left=330,right=780,cy=520),xoff,160,.72)
   p=ease((t-[0,3,6,9][phase])/.9);positions={n:mixpos(old[n],positions[n],p) for n in positions}
  graph(im,G,a,positions,scale=.72,locks=event.get('locks',[]),labels=False)
  text(im,'cut '+str(event['metrics']['cut']),480+xoff,720,45,GOLD,'serif','center')
  if phase==3:label2=pair('保留前缀 ','Keep prefix ',lang)+str(event['prefix']['bestK'])
  else:label2=pair('试探与锁定','Trial and lock',lang) if phase else pair('同一个起点','The same starting split',lang)
  text(im,label2,480+xoff,785,28,MUTED,'sans','center')
 line(im,(960,310),(960,795),FAINT,2)

def spectral(im,t,lang):
 r=DATA['spectral']['result'];ids=r['ids']
 text(im,'L = D − A',440,295,49,IVORY,'serif','center')
 for i,row in enumerate(r['L']):
  text(im,ids[i],150,395+i*68,27,MUTED,'mono')
  for j,value in enumerate(row):text(im,str(value),270+j*90,395+i*68,32,GOLD if i==j else MUTED,'mono','center')
 arrow(im,(760,540),(970,540),GOLD,3,ease((t-1)/3))
 text(im,' → '.join(r['order']),1400,300,41,TEAL,'sans','center')
 for i,s in enumerate(r['sweep']):
  x=1080+i*175;y=755;h=s['cut']*43*ease((t-3)/2);color=GOLD if s['k']==r['bestK'] and t>6 else BLUE
  box(im,(x,y-h,x+98,y),None,color,5)
  text(im,str(s['cut']),x+49,y-h-55,36,color,'mono','center')
  text(im,'k='+str(s['k']),x+49,y+13,24,MUTED,'mono','center')
 text(im,pair('扫描前缀的 cut','Cut for each prefix',lang),1410,390,29,MUTED,'sans','center')

def recursive(im,t,lang):
 tree=DATA['recursive']['result']['tree'];first=tree[0];second=tree[1]
 nodes=[(960,325,'ABCDE'),(510,505,''.join(first['children'][0])),(1330,505,''.join(first['children'][1])),(1110,710,''.join(second['children'][0])),(1560,710,''.join(second['children'][1]))]
 edges=[(0,1,1),(0,2,1),(2,3,4),(2,4,4)]
 for a,b,start in edges:line(im,(nodes[a][0],nodes[a][1]+40),(nodes[b][0],nodes[b][1]-35),TEAL,3,ease((t-start)/2))
 for i,(x,y,label) in enumerate(nodes):
  if i and t<(1 if i<3 else 4):continue
  w=max(130,len(label)*48+55);box(im,(x-w/2,y-35,x+w/2,y+45),GOLD if i==0 else TEAL,PANEL,10)
  text(im,label,x,y-22,43,IVORY,'mono','center')
 phase=0 if t<3 else 1 if t<6 else 2
 text(im,f"k = {phase+1}  ·  cut = {[0,3,8][phase]}",960,795,34,GOLD,'mono','center')

def multiway(im,t,lang):
 rows=[(pair('轮转','Round robin',lang),DATA['roundRobin']['result']),(pair('递归二分','Recursive',lang),DATA['recursive']['result']),(pair('递归 + 交换','Recursive + swaps',lang),DATA['refined']['result'])]
 for i,(name,r) in enumerate(rows):
  y=350+i*145;p=ease((t-i*.6)/2)
  text(im,name,140,y,36,IVORY,'sans',max_width=420)
  text(im,group_names(r['assignment']),700,y,31,MUTED,'mono')
  bar=round(r['metrics']['cut']/18*470*p)
  if bar:box(im,(1215,y+4,1215+bar,y+42),None,BLUE if i==0 else TEAL,4)
  text(im,str(r['metrics']['cut']),1770,y-13,54,GOLD,'serif','center')
  line(im,(140,y+90),(1810,y+90),FAINT,1)
 text(im,pair('同图 · k=3 · 单位面积 · 容量 2','Same graph · k=3 · unit areas · capacity 2',lang),960,800,29,MUTED,'sans','center')

def invitation(im,t,lang):
 names=[pair('衡量','Measure',lang),pair('构造','Construct',lang),pair('改进','Refine',lang),pair('扩展','Extend',lang)]
 for i,name in enumerate(names):
  x=340+i*410;color=TEAL if i==0 else MUTED
  if i<3:arrow(im,(x+115,400),(x+285,400),FAINT,2,ease((t-i*.3)/1.5))
  circle(im,(x,400),57,color,str(i+1));text(im,name,x,490,41,color,'serif','center')
 box(im,(480,590,1440,690),TEAL,'#123832',7,2)
 text(im,pair('Lesson 02 · 割代价与平衡','Lesson 02 · Cut cost and balance',lang),960,613,43,IVORY,'serif','center')
 text(im,pair('原创配乐《边界》 · FanqinZeng · CC BY 4.0','Original score “Boundaries” · FanqinZeng · CC BY 4.0',lang),960,745,25,MUTED,'sans','center')
 text(im,pair('制作规范与视觉参考：Su3037 · Learning Clustering','Production and visual reference: Su3037 · Learning Clustering',lang),960,787,23,MUTED,'sans','center')

DRAW={'teams':teams,'capacity':capacity,'title':title,'chip':chip,'graph':graph_intro,'cut':cut,'better':better,'area':area,'enumerate':enumerate_splits,'scale':scale,'initial':initial,'refine':refine,'spectral':spectral,'recursive':recursive,'multiway':multiway,'invitation':invitation}
