def induced_subgraph(nodes, edges, members):
    selected = set(members)
    return {'nodes':[node for node in nodes if node in selected],
            'edges':[[u,v,w] for u,v,w in edges if u in selected and v in selected]}

def largest_part(parts):
    return max(range(len(parts)), key=lambda i:(len(parts[i]),-i))
