def cut_cost(edges, assignment):
    return sum(w for u,v,w in edges if assignment[u] != assignment[v])

def group_loads(nodes, sizes, assignment, k):
    loads = [0] * k
    for node in nodes:
        loads[assignment[node]] += sizes[node]
    return loads
