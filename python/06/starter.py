def laplacian(nodes, edges):
    """Return L=D-A as nested lists, in the supplied node order."""
    raise NotImplementedError("TODO: laplacian")

def sweep_cut(nodes, edges, order, min_fraction=0.2):
    """Return best legal prefix assignment, or None if no prefix is legal.
    Both side counts / n must be >= min_fraction. Ties: shortest prefix.
    """
    raise NotImplementedError("TODO: sweep_cut")
