"""Regenerate standalone Python exercise files and the browser manifest."""
from pathlib import Path
import json
import textwrap

ROOT=Path(__file__).resolve().parents[1]
LABS={
'02':(
'''def cut_cost(edges, assignment):
    """Return sum of crossing [u,v,w] edge weights, counting each once."""
    raise NotImplementedError("TODO: cut_cost")

def group_loads(nodes, sizes, assignment, k):
    """Return a list of k area sums; sizes maps node names to positive areas."""
    raise NotImplementedError("TODO: group_loads")
''',
'''def cut_cost(edges, assignment):
    return sum(w for u,v,w in edges if assignment[u] != assignment[v])

def group_loads(nodes, sizes, assignment, k):
    loads = [0] * k
    for node in nodes:
        loads[assignment[node]] += sizes[node]
    return loads
'''),
'03':(
'''def grow_order(nodes, edges):
    """Return all nodes in grow order. Anchor: smallest name.
    Score: sum of weights to selected nodes. Ties: smallest name.
    """
    raise NotImplementedError("TODO: grow_order")

def balanced_initial(order):
    """Return {node:0/1}; first floor(n/2) nodes go to 0."""
    raise NotImplementedError("TODO: balanced_initial")
''',
'''def grow_order(nodes, edges):
    order = [min(nodes)]
    while len(order) < len(nodes):
        scores = {}
        for node in nodes:
            if node in order:
                continue
            scores[node] = sum(w for u,v,w in edges
                if (u == node and v in order) or (v == node and u in order))
        order.append(min(scores, key=lambda node: (-scores[node], node)))
    return order

def balanced_initial(order):
    return {node: int(i >= len(order)//2) for i,node in enumerate(order)}
'''),
'04':(
'''def pair_gain(edges, assignment, a, b):
    """Gain of exchanging opposite-side a,b: cut_before - cut_after."""
    raise NotImplementedError("TODO: pair_gain")

def best_prefix(gains):
    """Return earliest maximum cumulative-gain prefix length; allow empty 0."""
    raise NotImplementedError("TODO: best_prefix")
''',
'''def pair_gain(edges, assignment, a, b):
    def d(node):
        value = 0
        for u,v,w in edges:
            if node not in (u,v):
                continue
            other = v if u == node else u
            value += w if assignment[node] != assignment[other] else -w
        return value
    shared = sum(w for u,v,w in edges if {u,v} == {a,b})
    return d(a) + d(b) - 2*shared

def best_prefix(gains):
    total = best = 0
    index = 0
    for i,gain in enumerate(gains, 1):
        total += gain
        if total > best:
            best, index = total, i
    return index
'''),
'05':(
'''def move_gain(edges, assignment, node):
    """Ordinary graph single-node gain. Legality is checked separately."""
    raise NotImplementedError("TODO: move_gain")

def best_prefix(gains):
    """Return earliest maximum cumulative-gain prefix length, including 0."""
    raise NotImplementedError("TODO: best_prefix")
''',
'''def move_gain(edges, assignment, node):
    value = 0
    for u,v,w in edges:
        if node not in (u,v):
            continue
        other = v if u == node else u
        value += w if assignment[node] != assignment[other] else -w
    return value

def best_prefix(gains):
    total = best = 0
    index = 0
    for i,gain in enumerate(gains, 1):
        total += gain
        if total > best:
            best, index = total, i
    return index
'''),
'06':(
'''def laplacian(nodes, edges):
    """Return L=D-A as nested lists, in the supplied node order."""
    raise NotImplementedError("TODO: laplacian")

def sweep_cut(nodes, edges, order, min_fraction=0.2):
    """Return best legal prefix assignment, or None if no prefix is legal.
    Both side counts / n must be >= min_fraction. Ties: shortest prefix.
    """
    raise NotImplementedError("TODO: sweep_cut")
''',
'''def laplacian(nodes, edges):
    index = {node:i for i,node in enumerate(nodes)}
    matrix = [[0]*len(nodes) for _ in nodes]
    for u,v,w in edges:
        i,j = index[u],index[v]
        matrix[i][i] += w
        matrix[j][j] += w
        matrix[i][j] -= w
        matrix[j][i] -= w
    return matrix

def sweep_cut(nodes, edges, order, min_fraction=0.2):
    best_cost = float('inf')
    best = None
    for k in range(1,len(nodes)):
        if min(k,len(nodes)-k)/len(nodes) + 1e-12 < min_fraction:
            continue
        left = set(order[:k])
        a = {node:int(node not in left) for node in nodes}
        cost = sum(w for u,v,w in edges if a[u] != a[v])
        if cost < best_cost:
            best_cost, best = cost, a
    return best
'''),
'07':(
'''def induced_subgraph(nodes, edges, members):
    """Return {'nodes': [...], 'edges': [[u,v,w],...]}, preserving input order."""
    raise NotImplementedError("TODO: induced_subgraph")

def largest_part(parts):
    """parts is a list of member lists; return largest part's index.
    Ties: smallest index. At least one part is nonempty.
    """
    raise NotImplementedError("TODO: largest_part")
''',
'''def induced_subgraph(nodes, edges, members):
    selected = set(members)
    return {'nodes':[node for node in nodes if node in selected],
            'edges':[[u,v,w] for u,v,w in edges if u in selected and v in selected]}

def largest_part(parts):
    return max(range(len(parts)), key=lambda i:(len(parts[i]),-i))
'''),
'08':(
'''def round_robin(nodes, k):
    """Return {node:i%k} using the supplied node order."""
    raise NotImplementedError("TODO: round_robin")

def swap_gain(edges, assignment, a, b):
    """k-way gain from exchanging a and b. Capacity is checked separately."""
    raise NotImplementedError("TODO: swap_gain")
''',
'''def round_robin(nodes, k):
    return {node:i%k for i,node in enumerate(nodes)}

def swap_gain(edges, assignment, a, b):
    trial = dict(assignment)
    trial[a],trial[b] = trial[b],trial[a]
    before = sum(w for u,v,w in edges if assignment[u] != assignment[v])
    after = sum(w for u,v,w in edges if trial[u] != trial[v])
    return before-after
''')}

if __name__=='__main__':
    manifest={}
    for lesson,(starter,reference) in LABS.items():
        dest=ROOT/'python'/lesson
        dest.mkdir(parents=True,exist_ok=True)
        (dest/'starter.py').write_text(starter)
        (dest/'reference.py').write_text(reference)
        manifest[lesson]={'starter':starter,'reference':reference}
    (ROOT/'site/data').mkdir(parents=True,exist_ok=True)
    (ROOT/'site/data/python-labs.json').write_text(json.dumps(manifest,ensure_ascii=False))
