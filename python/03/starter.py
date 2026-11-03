def grow_order(nodes, edges):
    """Return all nodes in grow order. Anchor: smallest name.
    Score: sum of weights to selected nodes. Ties: smallest name.
    """
    raise NotImplementedError("TODO: grow_order")

def balanced_initial(order):
    """Return {node:0/1}; first floor(n/2) nodes go to 0."""
    raise NotImplementedError("TODO: balanced_initial")
