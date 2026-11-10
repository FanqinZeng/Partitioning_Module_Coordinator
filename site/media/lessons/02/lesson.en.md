# Cut cost and balance

00:00:00.000
Assign each vertex once and keep both groups nonempty.

00:00:10.000
Putting everything on one side gives cut 0 and an empty part.

00:00:20.000
For AE | BCD, add weights only when the endpoints belong to different groups.

00:00:30.000
Count each undirected edge once. The cut is 5 + 1 + 1 + 5 = 12.

00:00:40.000
Switch to ABC | DE. Only CD and CE cross the cut.

00:00:50.000
Both splits have a two-vertex and a three-vertex part. The cut drops from 12 to 3.

00:01:00.000
Set A’s area to 4. The counts stay fixed while the area of ABC grows to 6.

00:01:10.000
At capacity 4, ABC overflows. Check feasibility before comparing cuts.

00:01:20.000
With unit areas, the area ratio is 2/3 and normalized imbalance is 0.2.

00:01:30.000
In the lab, move a vertex. Predict the crossing edges, then check both part areas.
