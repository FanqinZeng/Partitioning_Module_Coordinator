# Kernighan–Lin pair swaps

00:00:00.000
The starting split AE | BCD costs 12. Try exchanging one vertex from each part.

00:00:10.000
One in and one out preserve counts. If vertex sizes differ, check the part areas separately.

00:00:20.000
D is external minus internal weight. For a pair, also subtract twice their shared edge weight.

00:00:30.000
A and D win the first choice. They share no edge, and the gain is 9.

00:00:40.000
Swapping A and D takes the cut to 3. Both vertices are locked for this pass.

00:00:50.000
Re-score the remaining vertices. The next gain is −8 and can still be tried.

00:01:00.000
The cumulative gains are 0, 9, 1. The first swap gives the best prefix.

00:01:10.000
Undo the second trial and keep the first. The accepted cut is 3.

00:01:20.000
The empty prefix has gain zero. An improving pass requires a positive prefix.

00:01:30.000
Step through the lab and record the trial cuts and the accepted cut separately.
