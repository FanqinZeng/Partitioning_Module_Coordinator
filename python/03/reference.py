def grow_order(nodes, edges):
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
