# Partition with Purpose: An Introduction

00:00:00.000 — 00:00:06.000
A project needs two collaborating teams.

00:00:06.000 — 00:00:12.000
Keep closely linked tasks together.

00:00:12.000 — 00:00:18.000
One part can have zero crossings.

00:00:18.000 — 00:00:24.000
Space and workload can forbid that assignment.

00:00:24.000 — 00:00:34.000
Partitioning means dividing under constraints.

00:00:34.000 — 00:00:40.000
Connected circuit cells also need regions.

00:00:40.000 — 00:00:46.000
Cross-region connections contribute to our cost.

00:00:46.000 — 00:00:53.000
Use five vertices to make the cost explicit.

00:00:53.000 — 00:01:00.000
An edge weight is the cost of cutting that connection.

00:01:00.000 — 00:01:07.000
Add the crossing edge weights, one by one.

00:01:07.000 — 00:01:14.000
The sum is 12. Count each undirected edge once.

00:01:14.000 — 00:01:20.000
Try ABC | DE. What happens to the cut?

00:01:20.000 — 00:01:26.000
The cut is 3; the counts are still two and three.

00:01:26.000 — 00:01:31.000
Balanced counts do not guarantee feasible areas.

00:01:31.000 — 00:01:38.000
Set A's area to 4: ABC then has area 6.

00:01:38.000 — 00:01:45.000
Five vertices have 15 nonempty, unlabeled splits.

00:01:45.000 — 00:01:50.000
Requiring counts two and three leaves ten.

00:01:50.000 — 00:01:57.000
At 100 vertices, the count already has 30 digits.

00:01:57.000 — 00:02:04.000
Trying every split soon becomes impractical.

00:02:04.000 — 00:02:10.000
Construct a start: random, greedy, or growing.

00:02:10.000 — 00:02:16.000
Growing adds B, producing cut 5.

00:02:16.000 — 00:02:22.000
KL exchanges a pair; FM moves one vertex.

00:02:22.000 — 00:02:28.000
Try, lock, then keep the best prefix.

00:02:28.000 — 00:02:34.000
Spectral structure orders the vertices.

00:02:34.000 — 00:02:40.000
Sweep legal thresholds for a smaller cut.

00:02:40.000 — 00:02:45.000
Repeated bisection produces more parts.

00:02:45.000 — 00:02:50.000
Each split solves its current induced subgraph.

00:02:50.000 — 00:02:55.000
Compare k-way methods on the same graph.

00:02:55.000 — 00:03:00.000
Check capacity before comparing cut.

00:03:00.000 — 00:03:10.000
Start with cut cost. Test your reasoning with labs and code.
