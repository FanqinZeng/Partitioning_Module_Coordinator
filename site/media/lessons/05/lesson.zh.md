# Fiduccia–Mattheyses 单点移动

00:00:00.000
FM 一次移动一个点。两组需非空，默认人数差最多为 1。
FM moves one vertex at a time. Keep both parts nonempty and their count difference at most 1.

00:00:10.000
A 和 E 的收益都高，但会造成 1 比 4。合法候选里 D 的收益最高。
A and E score highly but leave counts 1 and 4. D leads the legal candidates.

00:00:20.000
D–E 从跨组变为组内，贡献正收益。D–C 变成跨组，抵消部分收益。
D–E becomes internal, adding gain. D–C becomes crossing and offsets some of it.

00:00:30.000
D 移动后被锁定。cut 从 12 降到 9，A 现在可以移动。
Lock D after its move. The cut drops from 12 to 9, and A becomes legal.

00:00:40.000
A 移动贡献 6，试探 cut 降到 3。锁定名单加入 A。
A contributes 6 and lowers the trial cut to 3. Add A to the locks.

00:00:50.000
接下来试探 C，收益为 −2。暂时变差的状态仍属于本轮轨迹。
The trial move of C gains −2. The pass can temporarily get worse.

00:01:00.000
累计收益峰值是 9，出现在第 2 步。
The cumulative gain peaks at 9 after 2 moves.

00:01:10.000
恢复到前两步之后。最终接受 DE | ABC，cut 为 3。
Restore the state after the first two moves. Accept DE | ABC with cut 3.

00:01:20.000
严格等人数时，单点换侧会破坏等式。KL 的成对交换仍保持人数。
Under strict equal counts, a single move breaks equality. A KL pair swap preserves the counts.

00:01:30.000
在实验里改人数差阈值，观察合法候选和最佳前缀随之改变。
Change the allowed count gap and observe the legal candidates and best prefix in the lab.
