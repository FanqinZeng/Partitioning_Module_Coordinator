def laplacian(nodes, edges):
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
