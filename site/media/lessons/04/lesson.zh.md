# Kernighan–Lin 成对交换

00:00:00.000
起点 AE | BCD 的 cut 是 12。每次选一左一右，试着交换。
The starting split AE | BCD costs 12. Try exchanging one vertex from each part.

00:00:10.000
一进一出保持人数。面积不同的节点换侧时，仍要单独检查组面积。
One in and one out preserve counts. If vertex sizes differ, check the part areas separately.

00:00:20.000
D 值等于外部权重减内部权重。配对时还要减去两倍共享边权。
D is external minus internal weight. For a pair, also subtract twice their shared edge weight.

00:00:30.000
这一轮先选 A 与 D。两点间无边，配对增益为 9。
A and D win the first choice. They share no edge, and the gain is 9.

00:00:40.000
A 与 D 交换后，cut 变为 3。这两个点在本轮锁定。
Swapping A and D takes the cut to 3. Both vertices are locked for this pass.

00:00:50.000
剩余点还要重新评分。下一对增益是 −8，作为试探仍可以执行。
Re-score the remaining vertices. The next gain is −8 and can still be tried.

00:01:00.000
累计收益依次是 0、9、1。第一步结束时最高。
The cumulative gains are 0, 9, 1. The first swap gives the best prefix.

00:01:10.000
撤回第二步，只保留第一步。接受方案的 cut 是 3。
Undo the second trial and keep the first. The accepted cut is 3.

00:01:20.000
空前缀的累计收益是零。只有正收益前缀能改进这一轮。
The empty prefix has gain zero. An improving pass requires a positive prefix.

00:01:30.000
在实验里逐步播放，分别记录试探中的 cut 和回退后接受的 cut。
Step through the lab and record the trial cuts and the accepted cut separately.
