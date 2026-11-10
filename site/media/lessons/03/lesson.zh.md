# 初始二分

00:00:00.000
五个点分成两点和三点。先找到可行起点，再讨论质量。
Split five vertices into parts of two and three. Establish a feasible start, then compare quality.

00:00:10.000
三种方法使用同一张图和同一人数目标，便于比较构造过程。
The three methods share one graph and one count target, so we can compare their decisions.

00:00:20.000
种子 7 给出顺序 D、B、C、E、A。前两个点放左边。
Seed 7 gives the order D, B, C, E, A. Put the first two on the left.

00:00:30.000
得到 BD | ACE，cut 为 16。改变种子会得到另一种起点。
The split BD | ACE costs 16. Try another seed for a different start.

00:00:40.000
按字母顺序处理节点。A 已在左侧，比较 B 放到两侧的新增割边权重。
Visit vertices alphabetically. With A on the left, compare B’s added cut on either side.

00:00:50.000
B 放左侧后，左组满员。后续节点只看仍有名额的右组。
B fills the left part. Subsequent vertices use the remaining space on the right.

00:01:00.000
以 A 为起点，对未选节点计算它们连向左组的权重和。
Start at A and sum each unselected vertex’s edge weights into the left part.

00:01:10.000
B 的分数最高，加入左组，得到 AB | CDE。
B has the strongest connection. Adding it gives AB | CDE.

00:01:20.000
本例中贪心和生长都得到 cut 5。精确对照的 cut 为 3。
Greedy and growing both cost 5 here. Exact enumeration gives 3.

00:01:30.000
进入实验，先预测选择，再改种子或边权。下一章用交换改进起点。
Predict the next choice, then vary the seed or edge weights. Next, refine the start with swaps.
