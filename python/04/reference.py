def pair_gain(edges, assignment, a, b):
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
