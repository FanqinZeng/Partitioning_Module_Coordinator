def round_robin(nodes, k):
    return {node:i%k for i,node in enumerate(nodes)}

def swap_gain(edges, assignment, a, b):
    trial = dict(assignment)
    trial[a],trial[b] = trial[b],trial[a]
    before = sum(w for u,v,w in edges if assignment[u] != assignment[v])
    after = sum(w for u,v,w in edges if trial[u] != trial[v])
    return before-after
