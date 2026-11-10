# 多路划分

00:00:00.000
本例目标三组，每组非空，面积容量为 2。先检验容量，再比较 cut。
Use three nonempty parts with area capacity 2. Verify capacity before comparing cuts.

00:00:10.000
所有方法用同一张 G01。结果需要为每个节点指定唯一组号。
Every method uses the same G01. Each result must assign every vertex to exactly one part.

00:00:20.000
轮转按输入顺序轮流放入三组，得到 AD | BE | C。
Round robin assigns input vertices cyclically, giving AD | BE | C.

00:00:30.000
递归先看图结构，在本例得到 DE | C | AB。两种分组都符合容量。
Recursion uses graph structure and gives DE | C | AB. Both starts meet capacity here.

00:00:40.000
对两组间的候选节点做一进一出。先验面积容量，再比较 cut 的下降。
Consider swapping two vertices from different parts. Check area capacity, then compare cut gains.

00:00:50.000
这里最佳合法交换仍无正收益，算法停在当前分组。
Here even the best legal swap has no positive gain, so the search stops at its current split.

00:01:00.000
轮转 cut 为 18，递归和交换改进在此例都是 8。
Round robin costs 18. Recursion and swap refinement both cost 8 on this input.

00:01:10.000
精确枚举检查了 15 个可行无标号分组，最小 cut 是 8。
Exact enumeration checks 15 feasible unlabeled partitions. The minimum cut is 8.

00:01:20.000
容量按面积计算。改动单点面积后，即使人数不变，也要复核各组。
Capacity uses area. Change a vertex size and recheck the parts even when counts stay fixed.

00:01:30.000
到比较台重跑三种构造方法。记录输入、容量、可行性和 cut。
Re-run the three methods in the comparison lab. Record the input, capacity, feasibility and cut.
