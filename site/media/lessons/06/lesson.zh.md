# 谱二分

00:00:00.000
把边权填入邻接矩阵。每一行的权重和给出该点的加权度。
Put edge weights into the adjacency matrix. Each row sum gives the weighted degree.

00:00:10.000
拉普拉斯 L = D − A。对角线是度，非对角项是负边权，每行和为零。
The Laplacian L = D − A has degrees on the diagonal, negative edge weights elsewhere and zero row sums.

00:00:20.000
取第二小特征值对应的向量，每个节点获得一个坐标。
Take an eigenvector for the second-smallest eigenvalue. Each vertex gets one coordinate.

00:00:30.000
按坐标从小到大，顺序为 E、D、C、B、A。向量翻号会把顺序反过来。
Sort the coordinates to get E, D, C, B, A. Negating the vector reverses this order.

00:00:40.000
沿排序尝试相邻点之间的切口。两侧要满足给定人数窗口。
Try gaps between consecutive vertices. Both parts must meet the count window.

00:00:50.000
本例合法前缀的 cut 依次为 6、3、5、6。保留最小项。
The legal prefix costs are 6, 3, 5, 6. Choose the lowest-cost entry.

00:01:00.000
在第 2 个点之后切开。得到 DE | ABC，cut 为 3。
Cut after vertex 2: DE | ABC, with cut 3.

00:01:10.000
这个结果来自一条谱排序的扫描。小图可再用精确枚举校准。
The result comes from sweeping one spectral order. Check small instances against exact enumeration.

00:01:20.000
断连图可能有多个零特征值，此时排序方向可能不唯一。
A disconnected graph can have several zero eigenvalues, so its ordering direction can be non-unique.

00:01:30.000
调整人数窗口，检查切口是否合法。下一章把二分用到选中的子图。
Vary the count window and check which cuts remain legal. Next, bisect a selected subgraph.
