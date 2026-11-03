"""Independent property checks shared by the downloadable and browser labs.
No reference solution is substituted for a learner function.
"""
import json
import random
from math import isclose

NODES=list('ABCDE')
EDGES=[['A','B',5],['A','C',1],['B','C',4],['C','D',2],['C','E',1],['D','E',5]]
BAD={'A':0,'B':1,'C':1,'D':1,'E':0}
GOOD={'A':0,'B':0,'C':0,'D':1,'E':1}

def cut(edges,a):
    return sum(edge[2] for edge in edges if a[edge[0]] != a[edge[1]])

def eq(a,b):
    if isinstance(a,(int,float)) and isinstance(b,(int,float)):
        return isclose(a,b,abs_tol=1e-8,rel_tol=1e-8)
    return a==b

def expect(actual,expected):
    if not eq(actual,expected):
        raise AssertionError('expected '+repr(expected)+', got '+repr(actual))

def check_lab(lesson, source):
    scope={}
    compile(source,'student.py','exec')
    exec(source,scope)
    results=[]
    def case(name,fn):
        try:
            fn()
            results.append({'name':name,'passed':True})
        except NotImplementedError as e:
            results.append({'name':name,'passed':False,'incomplete':True,'message':str(e)})
        except Exception as e:
            results.append({'name':name,'passed':False,'message':type(e).__name__+': '+str(e)})
    def call(name,*args):
        f=scope.get(name)
        if not callable(f):
            raise NotImplementedError('Missing function '+name)
        return f(*args)
    def prefixes():
        for xs in [[],[-3,-1],[0,0],[9,-8],[-2,5,-1],[2,-2,2]]:
            k=call('best_prefix',xs)
            values=[sum(xs[:i]) for i in range(len(xs)+1)]
            expect(k,values.index(max(values)))
    if lesson=='02':
        case('G01 / bad cut 12',lambda:expect(call('cut_cost',EDGES,BAD),12))
        case('G01 / good cut 3',lambda:expect(call('cut_cost',EDGES,GOOD),3))
        case('Area is not count',lambda:expect(call('group_loads',NODES,dict(A=4,B=1,C=1,D=1,E=1),GOOD,2),[6,2]))
        case('Empty edge list',lambda:expect(call('cut_cost',[],BAD),0))
        case('Renamed part labels',lambda:expect(call('cut_cost',EDGES,{x:1-p for x,p in GOOD.items()}),3))
    elif lesson=='03':
        case('Grow / anchor and first neighbor',lambda:expect(call('grow_order',NODES,EDGES)[:2],['A','B']))
        case('Disconnected tie rule',lambda:expect(call('grow_order',list('DCBA'),[]),list('ABCD')))
        case('Odd node counts',lambda:expect(list(call('balanced_initial',NODES).values()).count(0),2))
        case('Even node counts',lambda:expect(call('balanced_initial',list('ABCD')),dict(A=0,B=0,C=1,D=1)))
        case('Input order determines split',lambda:expect(call('balanced_initial',list('EDCBA')),dict(E=0,D=0,C=1,B=1,A=1)))
    elif lesson in ('04','05'):
        if lesson=='04':
            case('G01 / A-D gain',lambda:expect(call('pair_gain',EDGES,BAD,'A','D'),9))
            case('Shared-edge correction',lambda:expect(call('pair_gain',[['A','B',5]],{'A':0,'B':1},'A','B'),0))
        else:
            case('G01 / A gain',lambda:expect(call('move_gain',EDGES,BAD,'A'),6))
            case('G01 / D gain',lambda:expect(call('move_gain',EDGES,BAD,'D'),3))
        case('Empty prefix',lambda:expect(call('best_prefix',[]),0))
        case('Negative first trial',lambda:expect(call('best_prefix',[-2,5,-1]),2))
        case('Earliest maximum and all-negative',prefixes)
    elif lesson=='06':
        case('G01 / first Laplacian row',lambda:expect(call('laplacian',NODES,EDGES)[0],[6,-5,-1,0,0]))
        case('Two-node Laplacian',lambda:expect(call('laplacian',list('AB'),[['A','B',2]]),[[2,-2],[-2,2]]))
        case('G01 / best sweep',lambda:expect(cut(EDGES,call('sweep_cut',NODES,EDGES,list('EDCBA'),.2)),3))
        case('No legal odd strict split',lambda:expect(call('sweep_cut',NODES,EDGES,NODES,.5),None))
        case('Sweep tie chooses shortest',lambda:expect(call('sweep_cut',list('ABC'),[],list('ABC'),.2),dict(A=0,B=1,C=1)))
    elif lesson=='07':
        case('Induced ABC',lambda:expect(call('induced_subgraph',NODES,EDGES,list('ABC')),{'nodes':list('ABC'),'edges':EDGES[:3]}))
        case('Largest part',lambda:expect(call('largest_part',[list('DE'),list('ABC')]),1))
        case('First label wins a tie',lambda:expect(call('largest_part',[['A'],['B']]),0))
        case('Isolated vertex',lambda:expect(call('induced_subgraph',NODES,EDGES,['A']),{'nodes':['A'],'edges':[]}))
        case('Preserve input order',lambda:expect(call('induced_subgraph',list('CBA'),[],list('AB')),{'nodes':list('BA'),'edges':[]}))
    else:
        case('G01 / round-robin labels',lambda:expect(call('round_robin',NODES,3),dict(A=0,B=1,C=2,D=0,E=1)))
        case('G01 / round-robin cut',lambda:expect(cut(EDGES,call('round_robin',NODES,3)),18))
        case('Nonalphabetical input order',lambda:expect(call('round_robin',list('CBA'),2),dict(C=0,B=1,A=0)))
        case('Same-group swap',lambda:expect(call('swap_gain',EDGES,GOOD,'A','B'),0))
        case('Pair gain on G01',lambda:expect(call('swap_gain',EDGES,BAD,'A','D'),9))
    def randomized():
        rng=random.Random(1701+int(lesson))
        for _ in range(120):
            nodes=list('ABCDEFG')[:rng.randrange(3,8)]
            edges=[[u,v,rng.randrange(1,20)/2] for i,u in enumerate(nodes) for v in nodes[i+1:] if rng.random()<.4]
            a={x:int(i>=len(nodes)//2) for i,x in enumerate(nodes)}
            if lesson=='02':
                expect(call('cut_cost',edges,a),cut(edges,a))
                sizes={x:rng.randrange(1,5) for x in nodes}
                expect(call('group_loads',nodes,sizes,a,2),[sum(sizes[x] for x in nodes if a[x]==p) for p in range(2)])
            elif lesson=='03':
                order=call('grow_order',nodes,edges)
                expect(sorted(order),nodes)
                expect(order[0],min(nodes))
                for i,node in enumerate(order[1:],1):
                    selected=set(order[:i]);scores={x:sum(w for u,v,w in edges if (u==x and v in selected) or (v==x and u in selected)) for x in nodes if x not in selected}
                    expect(node,min(scores,key=lambda x:(-scores[x],x)))
                b=call('balanced_initial',order);expect(set(b),set(nodes));expect(sum(v==0 for v in b.values()),len(nodes)//2)
            elif lesson in ('04','05','08'):
                x=nodes[0];y=nodes[-1]
                if lesson=='05':
                    t=dict(a);t[x]=1-t[x];expect(call('move_gain',edges,a,x),cut(edges,a)-cut(edges,t))
                else:
                    if lesson=='08':
                        a=call('round_robin',nodes,3);expect(a,{x:i%3 for i,x in enumerate(nodes)})
                    t=dict(a);t[x],t[y]=t[y],t[x]
                    expect(call('pair_gain' if lesson=='04' else 'swap_gain',edges,a,x,y),cut(edges,a)-cut(edges,t))
                if lesson!='08':
                    xs=[rng.randrange(-9,10) for _ in range(8)];sums=[sum(xs[:i]) for i in range(9)];expect(call('best_prefix',xs),sums.index(max(sums)))
            elif lesson=='06':
                M=call('laplacian',nodes,edges)
                expect(len(M),len(nodes))
                x=[rng.random() for _ in nodes];idx={v:i for i,v in enumerate(nodes)}
                for i,row in enumerate(M):
                    expect(sum(row),0)
                    for j,value in enumerate(row):expect(value,M[j][i])
                expect(sum(x[i]*M[i][j]*x[j] for i in range(len(nodes)) for j in range(len(nodes))),sum(w*(x[idx[u]]-x[idx[v]])**2 for u,v,w in edges))
                order=nodes[:];rng.shuffle(order);b=call('sweep_cut',nodes,edges,order,.2)
                costs=[]
                for k in range(1,len(nodes)):
                    if min(k,len(nodes)-k)/len(nodes)>=.2-1e-12:
                        t={v:int(v not in order[:k]) for v in nodes};costs.append((cut(edges,t),k,t))
                expected=min(costs,key=lambda t:(t[0],t[1]))[2];expect(b,expected)
            else:
                members=nodes[::2];sub=call('induced_subgraph',nodes,edges,members)
                expect(sub,{'nodes':members,'edges':[e for e in edges if e[0] in members and e[1] in members]})
                parts=[nodes[:1],nodes[1:]];expect(call('largest_part',parts),max(range(2),key=lambda i:(len(parts[i]),-i)))
    case('120 seeded property cases',randomized)
    visualization=None
    try:
        if lesson=='02':visualization={'assignment':GOOD,'studentCut':call('cut_cost',EDGES,GOOD),'studentAreas':call('group_loads',NODES,{x:1 for x in NODES},GOOD,2)}
        elif lesson=='03':
            order=call('grow_order',NODES,EDGES);visualization={'assignment':call('balanced_initial',order),'studentOrder':order}
        elif lesson=='04':
            t=dict(BAD);t['A'],t['D']=t['D'],t['A'];visualization={'assignment':t,'studentGain':call('pair_gain',EDGES,BAD,'A','D'),'studentPrefix':call('best_prefix',[9,-8])}
        elif lesson=='05':
            t=dict(BAD);t['D']=0;visualization={'assignment':t,'studentGain':call('move_gain',EDGES,BAD,'D'),'studentPrefix':call('best_prefix',[3,6,-6])}
        elif lesson=='06':visualization={'assignment':call('sweep_cut',NODES,EDGES,list('EDCBA'),.2),'studentMatrix':call('laplacian',NODES,EDGES)}
        elif lesson=='07':
            parts=[list('DE'),list('ABC')];i=call('largest_part',parts);visualization={'assignment':GOOD,'studentSelectedPart':i,'studentSubgraph':call('induced_subgraph',NODES,EDGES,parts[i])}
        else:
            a=call('round_robin',NODES,3);visualization={'assignment':a,'studentGain':call('swap_gain',EDGES,a,'A','B')}
    except Exception:
        pass
    return {'checks':results,'passed':all(r['passed'] for r in results),'incomplete':any(r.get('incomplete') for r in results),'visualization':visualization}

if __name__=='__main__':
    import sys
    from pathlib import Path
    lesson=sys.argv[1]
    source=Path(sys.argv[2]).read_text()
    out=check_lab(lesson,source)
    print(json.dumps(out,indent=2))
    sys.exit(0 if out['passed'] else 1)
