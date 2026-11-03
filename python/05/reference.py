def move_gain(edges, assignment, node):
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
