"""Independent slow reference: derive every gain by actually changing labels.
Unlike the JS engines this does not maintain D values or incremental net counts.
"""
import json
import sys
def solve(case):
    g=case['graph'];ids=sorted(n['id'] for n in g['nodes']);edges=g['edges'];side=case['initial'].copy();method=case['method'];passes=[]
    def cut(a):return sum(e['w'] for e in edges if a[e['u']]!=a[e['v']])
    for _ in range(case.get('maxPasses',10)):
        start=side.copy();trial=side.copy();locked=set();steps=[]
        while True:
            candidates=[]
            if method=='kl':
                for a in ids:
                    if a in locked or trial[a]!=0:continue
                    for b in ids:
                        if b in locked or trial[b]!=1:continue
                        t=trial.copy();t[a],t[b]=t[b],t[a]
                        candidates.append((cut(trial)-cut(t),a,b,t))
            else:
                for a in ids:
                    if a in locked:continue
                    t=trial.copy();t[a]=1-t[a];n0=sum(t[x]==0 for x in ids);n1=len(ids)-n0
                    if min(n0,n1)==0 or abs(n0-n1)>case['maxDiff']:continue
                    candidates.append((cut(trial)-cut(t),a,'',t))
            if not candidates:break
            candidates.sort(key=lambda c:(-c[0],c[1],c[2]));gain,a,b,t=candidates[0]
            locked.add(a)
            if b:locked.add(b)
            trial=t;steps.append({'chosen':[a,b] if b else [a],'gain':gain,'assignment':t.copy()})
        values=[0]+[sum(s['gain'] for s in steps[:i]) for i in range(1,len(steps)+1)]
        best=values.index(max(values));side=start if best==0 else steps[best-1]['assignment'].copy()
        passes.append({'gains':[s['gain'] for s in steps],'chosen':[s['chosen'] for s in steps],'bestK':best,'cut':cut(side)})
        if best==0:break
    return {'assignment':side,'cut':cut(side),'passes':passes}
if __name__=='__main__':print(json.dumps([solve(c) for c in json.load(sys.stdin)]))
