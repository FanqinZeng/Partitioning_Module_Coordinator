// Author bilingual beats against the same solver events learners see on the site.
import {writeFileSync, mkdirSync} from 'node:fs';
import {G01, BAD, GOOD, clone, exact, metrics, run} from '../../site/engines/course.js';

const graph = G01;
const labels = (zh, en) => [zh, en];
const chapter = (zh, en, ...beats) => ({title: labels(zh, en), beats});
const beat = (zh, en, view, seconds = 10) => ({caption: labels(zh, en), view, seconds});
const row = (name, value, tone = 'muted') => ({name, value, tone});
const signed = n => n > 0 ? '+' + n : String(n).replace('-', '−');
const grouping = assignment => [...new Set(Object.values(assignment))].sort((a,b)=>a-b)
  .map(group => Object.keys(assignment).sort().filter(id => assignment[id] === group).join('')).join(' | ');
const chart = (heading, values, best) => ({type:'chart', heading, values, best});
const cards = (heading, ...rows) => ({type:'cards', heading, rows});
const diagram = (assignment, rows, options = {}) => ({type:'graph', assignment, rows, ...options});
const event = (state, rows, options = {}) => diagram(state.assignment, rows, {locks:state.locks, ...options});
const cut = value => row('cut', value, 'gold');
const groups = value => row(labels('分组','Groups'), grouping(value));
const counts = value => row(labels('节点数','Vertex counts'), value.join(' : '));
const areas = value => row(labels('面积和','Area totals'), value.join(' : '));
const edges = list => list.map(e => e.u+e.v);
const sum = list => list.map(e => e.w).join(' + ');
const bad = metrics(graph, BAD);
const good = metrics(graph, GOOD);
const resized = clone(graph);
resized.nodes.find(node => node.id === 'A').size = 4;
const overloaded = metrics(resized, GOOD, 2, 4);
const allTogether = Object.fromEntries(graph.nodes.map(n => [n.id, 0]));
const empty = metrics(graph, allTogether);
const local = labels('课程公共图 G01','Shared graph G01');

function solve(method, params) {
  const result = run(method, graph, params);
  if (result.status !== 'completed') throw Error(`${method} did not finish: ${result.status}`);
  return result;
}

function pass(method) {
  const events = solve(method).events;
  const end = events.findIndex(e => e.kind === 'best-prefix');
  if (end < 2) throw Error(`${method}: missing complete first pass`);
  return {start: events[0], trials: events.slice(1,end), accepted:events[end]};
}

const random = solve('initial', {strategy:'random', seed:7});
const greedy = solve('initial', {strategy:'greedy'});
const growing = solve('initial', {strategy:'grow'});
const kl = pass('kl');
const fm = pass('fm');
const spectral = solve('spectral');
const recursive = solve('recursive', {k:3});
const roundRobin = solve('multiway', {k:3,capacity:2,strategy:'round-robin'});
const refined = solve('multiway', {k:3,capacity:2});
const oracle = exact(graph, {k:3,capacity:2});
const [r0,r1,r2] = recursive.events;

const films = {
  '02': {
    title: labels('割代价与平衡','Cut cost and balance'),
    description: labels('在五节点图上逐条算割代价，再检验面积容量。','Count crossing edges on a five-vertex graph, then check area capacity.'),
    scenes: [
      chapter('先确认分组','Check the assignment first',
        beat('每个节点恰好属于一组，两组都要有节点。','Assign each vertex once and keep both groups nonempty.', diagram(BAD,[row(local,'A–E'),groups(BAD),counts(bad.counts)])),
        beat(`全放在一侧时，cut 是 ${empty.cut}，但另一侧为空。`,`Putting everything on one side gives cut ${empty.cut} and an empty part.`,diagram(allTogether,[cut(empty.cut),counts(empty.counts),row(labels('二分可行','Feasible split'),labels('否：空组','No: empty part'),'rose')]))),
      chapter('逐条累计跨组边','Add the crossing weights',
        beat(`从 ${grouping(BAD)} 出发，只把连接不同组的边加入和式。`,`For ${grouping(BAD)}, add weights only when the endpoints belong to different groups.`,diagram(BAD,bad.cutEdges.map(e=>row(e.u+e.v,e.w,'gold')),{accumulate:edges(bad.cutEdges)})),
        beat(`每条无向边只算一次。割代价为 ${sum(bad.cutEdges)} = ${bad.cut}。`,`Count each undirected edge once. The cut is ${sum(bad.cutEdges)} = ${bad.cut}.`,diagram(BAD,[row(labels('跨组边','Crossing edges'),edges(bad.cutEdges).join(' · ')),row(labels('权重和','Weight sum'),sum(bad.cutEdges)),cut(bad.cut)],{focus:edges(bad.cutEdges)}))),
      chapter('人数相同，连接质量不同','Same counts, different cut',
        beat(`改成 ${grouping(GOOD)}，只有 ${edges(good.cutEdges).join(' 和 ')} 跨组。`,`Switch to ${grouping(GOOD)}. Only ${edges(good.cutEdges).join(' and ')} cross the cut.`,diagram(GOOD,[groups(GOOD),counts(good.counts),row(labels('跨组边','Crossing edges'),sum(good.cutEdges)),cut(good.cut)],{focus:edges(good.cutEdges)})),
        beat(`两种方案都是两点与三点，cut 从 ${bad.cut} 降到 ${good.cut}。`,`Both splits have a two-vertex and a three-vertex part. The cut drops from ${bad.cut} to ${good.cut}.`,chart(labels('相同人数分布下的割代价','Cut costs at the same count split'),[row(grouping(BAD),bad.cut),row(grouping(GOOD),good.cut)],1))),
      chapter('面积是另一条约束','Check area capacity separately',
        beat('把 A 的面积改成 4。节点数没变，ABC 的面积变成 6。','Set A’s area to 4. The counts stay fixed while the area of ABC grows to 6.',diagram(GOOD,[counts(overloaded.counts),areas(overloaded.areas),row(labels('面积容量','Area capacity'),overloaded.capacity),cut(overloaded.cut)],{sizes:{A:4}})),
        beat('每组容量为 4 时，ABC 超出容量。先拒绝这份方案，再比较 cut。','At capacity 4, ABC overflows. Check feasibility before comparing cuts.',chart(labels('组面积与容量','Part areas and capacity'),[row('ABC',overloaded.areas[0],'rose'),row('DE',overloaded.areas[1],'teal'),row(labels('容量','Capacity'),overloaded.capacity,'gold')],2))),
      chapter('带着指标做实验','Take the metrics into the lab',
        beat(`默认面积为 1 时，面积比是 2/3，面积不平衡度是 ${good.imbalance}。`,`With unit areas, the area ratio is 2/3 and normalized imbalance is ${good.imbalance}.`,cards(labels('两个平衡指标','Two measures of balance'),row(labels('最小面积 ÷ 最大面积','Minimum area / maximum area'),good.ratio.toFixed(3),'teal'),row(labels('面积差 ÷ 总面积','Area gap / total area'),good.imbalance,'gold'))),
        beat('在实验里移动一个点，先预测哪些边会跨组，再检查组面积。','In the lab, move a vertex. Predict the crossing edges, then check both part areas.',diagram(GOOD,[groups(GOOD),row(labels('预测','Predict'),labels('跨组边','Crossing edges'),'gold'),row(labels('复核','Verify'),labels('组面积','Part areas'),'teal')]))),
    ],
  },
  '03': {
    title: labels('初始二分','Initial bisection'),
    description: labels('用相同人数约束比较随机、顺序贪心和区域生长。','Compare random, sequential greedy and region growing under the same count target.'),
    scenes: [
      chapter('固定目标人数','Fix the target counts',
        beat('五个点分成两点和三点。先找到可行起点，再讨论质量。','Split five vertices into parts of two and three. Establish a feasible start, then compare quality.',cards(labels('构造契约','Construction contract'),row(labels('左组节点数','Left part count'),2,'teal'),row(labels('右组节点数','Right part count'),3,'blue'))),
        beat('三种方法使用同一张图和同一人数目标，便于比较构造过程。','The three methods share one graph and one count target, so we can compare their decisions.',cards(labels('三种构造规则','Three construction rules'),row(labels('随机','Random'),labels('先洗牌','Shuffle first')),row(labels('顺序贪心','Sequential greedy'),labels('比较增量','Compare increments')),row(labels('区域生长','Region growing'),labels('扩张边界','Grow from a seed'))))),
      chapter('随机是可复现的基线','Random gives a repeatable baseline',
        beat(`种子 7 给出顺序 ${random.events[0].order.join('、')}。前两个点放左边。`,`Seed 7 gives the order ${random.events[0].order.join(', ')}. Put the first two on the left.`,event(random.events[0],[row('seed',7),row(labels('洗牌顺序','Shuffled order'),random.events[0].order.join(' → '),'gold'),groups(random.result.assignment)])),
        beat(`得到 ${grouping(random.result.assignment)}，cut 为 ${random.result.cut}。改变种子会得到另一种起点。`,`The split ${grouping(random.result.assignment)} costs ${random.result.cut}. Try another seed for a different start.`,diagram(random.result.assignment,[groups(random.result.assignment),counts(random.result.metrics.counts),cut(random.result.cut)]))),
      chapter('贪心比较当前增量','Greedy checks incremental cost',
        beat('按字母顺序处理节点。A 已在左侧，比较 B 放到两侧的新增割边权重。','Visit vertices alphabetically. With A on the left, compare B’s added cut on either side.',event(greedy.events[0],greedy.events[1].candidates.map(c=>row(labels(`B 到组 ${c.side}`,`B to part ${c.side}`),c.increment,c.side===0?'gold':'muted')))),
        beat('B 放左侧后，左组满员。后续节点只看仍有名额的右组。','B fills the left part. Subsequent vertices use the remaining space on the right.',event(greedy.events[2],[groups(greedy.result.assignment),row(labels('左组','Left part'),labels('已满','Full'),'rose'),cut(greedy.result.cut)]))),
      chapter('区域生长看连接强度','Region growing follows strong links',
        beat('以 A 为起点，对未选节点计算它们连向左组的权重和。','Start at A and sum each unselected vertex’s edge weights into the left part.',event(growing.events[0],growing.events[1].candidates.map(c=>row(c.node,c.score,c.node===growing.events[1].chosen?'gold':'muted')))),
        beat(`B 的分数最高，加入左组，得到 ${grouping(growing.result.assignment)}。`,`B has the strongest connection. Adding it gives ${grouping(growing.result.assignment)}.`,event(growing.events[1],[groups(growing.result.assignment),counts(growing.result.metrics.counts),cut(growing.result.cut)],{focus:['AB']}))),
      chapter('起点还可以改进','A starting split can be refined',
        beat(`本例中贪心和生长都得到 cut ${growing.result.cut}。精确对照的 cut 为 ${exact(graph,{k:2,maxDiff:1}).best.cut}。`,`Greedy and growing both cost ${growing.result.cut} here. Exact enumeration gives ${exact(graph,{k:2,maxDiff:1}).best.cut}.`,chart(labels('同一张图的对照','Comparisons on one graph'),[row(labels('随机','Random'),random.result.cut),row(labels('顺序贪心','Greedy'),greedy.result.cut),row(labels('区域生长','Growing'),growing.result.cut),row(labels('精确对照','Exact'),exact(graph,{k:2,maxDiff:1}).best.cut)],3)),
        beat('进入实验，先预测选择，再改种子或边权。下一章用交换改进起点。','Predict the next choice, then vary the seed or edge weights. Next, refine the start with swaps.',diagram(growing.result.assignment,[groups(growing.result.assignment),row(labels('下一章','Next lesson'),'Kernighan–Lin','gold')]))),
    ],
  },
  '04': {
    title: labels('Kernighan–Lin 成对交换','Kernighan–Lin pair swaps'),
    description: labels('走完一轮配对试探、锁定和最佳前缀回退。','Follow a complete pass of trial swaps, locks and rollback to the best prefix.'),
    scenes: [
      chapter('交换保留人数','A pair swap preserves counts',
        beat(`起点 ${grouping(BAD)} 的 cut 是 ${bad.cut}。每次选一左一右，试着交换。`,`The starting split ${grouping(BAD)} costs ${bad.cut}. Try exchanging one vertex from each part.`,event(kl.start,[groups(BAD),counts(bad.counts),cut(bad.cut)])),
        beat('一进一出保持人数。面积不同的节点换侧时，仍要单独检查组面积。','One in and one out preserve counts. If vertex sizes differ, check the part areas separately.',cards(labels('交换的约束','What a swap preserves'),row(labels('节点数','Vertex counts'),labels('保持不变','Preserved'),'teal'),row(labels('面积和','Area totals'),labels('需另行检查','Check separately'),'gold')))),
      chapter('估计一对的收益','Score each candidate pair',
        beat('D 值等于外部权重减内部权重。配对时还要减去两倍共享边权。','D is external minus internal weight. For a pair, also subtract twice their shared edge weight.',cards(labels('配对增益','Pair gain'),row('D(v)','external − internal','teal'),row('g(a, b)','D(a) + D(b) − 2w(a,b)','gold'))),
        beat(`这一轮先选 A 与 D。两点间无边，配对增益为 ${kl.trials[0].trialGain}。`,`A and D win the first choice. They share no edge, and the gain is ${kl.trials[0].trialGain}.`,event(kl.start,kl.trials[0].candidates.slice(0,4).map((c,i)=>row(c.a+' ↔ '+c.b,signed(c.gain),i===0?'gold':'muted'))))),
      chapter('试探与锁定','Try the swap and lock the pair',
        beat(`A 与 D 交换后，cut 变为 ${kl.trials[0].metrics.cut}。这两个点在本轮锁定。`,`Swapping A and D takes the cut to ${kl.trials[0].metrics.cut}. Both vertices are locked for this pass.`,event(kl.trials[0],[groups(kl.trials[0].assignment),row(labels('锁定','Locked'),kl.trials[0].locks.join(' · ')),cut(kl.trials[0].metrics.cut)])),
        beat(`剩余点还要重新评分。下一对增益是 ${signed(kl.trials[1].trialGain)}，作为试探仍可以执行。`,`Re-score the remaining vertices. The next gain is ${signed(kl.trials[1].trialGain)} and can still be tried.`,event(kl.trials[1],[row(labels('本步增益','Trial gain'),signed(kl.trials[1].trialGain),'rose'),cut(kl.trials[1].metrics.cut)]))),
      chapter('保留累计收益最高的前缀','Keep the best cumulative prefix',
        beat(`累计收益依次是 ${kl.accepted.prefix.gains.join('、')}。第一步结束时最高。`,`The cumulative gains are ${kl.accepted.prefix.gains.join(', ')}. The first swap gives the best prefix.`,chart(labels('累计增益','Cumulative gain'),kl.accepted.prefix.gains.map((v,i)=>row(String(i),v)),kl.accepted.prefix.bestK)),
        beat(`撤回第二步，只保留第一步。接受方案的 cut 是 ${kl.accepted.metrics.cut}。`,`Undo the second trial and keep the first. The accepted cut is ${kl.accepted.metrics.cut}.`,event(kl.accepted,[groups(kl.accepted.assignment),row(labels('保留步数','Accepted swaps'),kl.accepted.prefix.bestK,'teal'),cut(kl.accepted.metrics.cut)],{from:kl.trials[1].assignment}))),
      chapter('在实验中回放','Replay the pass in the lab',
        beat('空前缀的累计收益是零。只有正收益前缀能改进这一轮。','The empty prefix has gain zero. An improving pass requires a positive prefix.',cards(labels('停止条件','When to stop'),row(labels('最佳前缀收益','Best prefix gain'),labels('正数：接受','Positive: accept'),'teal'),row(labels('空前缀收益','Empty prefix gain'),labels('零：保留起点','Zero: keep the start')))),
        beat('在实验里逐步播放，分别记录试探中的 cut 和回退后接受的 cut。','Step through the lab and record the trial cuts and the accepted cut separately.',event(kl.accepted,[row(labels('试探末尾','Last trial'),kl.trials.at(-1).metrics.cut,'rose'),row(labels('接受结果','Accepted'),kl.accepted.metrics.cut,'gold')]))),
    ],
  },
  '05': {
    title: labels('Fiduccia–Mattheyses 单点移动','Fiduccia–Mattheyses vertex moves'),
    description: labels('按人数差过滤候选，观察单点增益更新、锁定和最佳前缀。','Filter moves by count balance, then watch gains, locks and the best prefix update.'),
    scenes: [
      chapter('先过滤候选','Filter candidates before ranking',
        beat('FM 一次移动一个点。两组需非空，默认人数差最多为 1。','FM moves one vertex at a time. Keep both parts nonempty and their count difference at most 1.',event(fm.start,[groups(BAD),counts(bad.counts),row(labels('允许人数差','Allowed count gap'),'≤ 1','teal'),cut(bad.cut)])),
        beat('A 和 E 的收益都高，但会造成 1 比 4。合法候选里 D 的收益最高。','A and E score highly but leave counts 1 and 4. D leads the legal candidates.',event(fm.start,fm.start.gains.map(g=>row(g.node+' · '+signed(g.gain),g.legal?labels('合法','Legal'):labels('超出人数差','Count violation'),g.node==='D'?'gold':g.legal?'teal':'rose'))))),
      chapter('移动 D 会改变哪些边','What changes when D moves?',
        beat('D–E 从跨组变为组内，贡献正收益。D–C 变成跨组，抵消部分收益。','D–E becomes internal, adding gain. D–C becomes crossing and offsets some of it.',event(fm.start,graph.edges.filter(e=>[e.u,e.v].includes('D')).map(e=>row(e.u+e.v,signed((fm.start.assignment[e.u]!==fm.start.assignment[e.v]?1:-1)*e.w),e.u+e.v==='DE'?'gold':'rose')),{focus:['CD','DE']})),
        beat(`D 移动后被锁定。cut 从 ${bad.cut} 降到 ${fm.trials[0].metrics.cut}，A 现在可以移动。`,`Lock D after its move. The cut drops from ${bad.cut} to ${fm.trials[0].metrics.cut}, and A becomes legal.`,event(fm.trials[0],[groups(fm.trials[0].assignment),row(labels('锁定','Locked'),'D'),row(labels('A 的候选增益','Gain for A'),signed(fm.trials[0].gains.find(x=>x.node==='A').gain),'gold'),cut(fm.trials[0].metrics.cut)]))),
      chapter('重新评分并继续试探','Re-score and continue the trial',
        beat(`A 移动贡献 ${fm.trials[1].trialGain}，试探 cut 降到 ${fm.trials[1].metrics.cut}。锁定名单加入 A。`,`A contributes ${fm.trials[1].trialGain} and lowers the trial cut to ${fm.trials[1].metrics.cut}. Add A to the locks.`,event(fm.trials[1],[groups(fm.trials[1].assignment),row(labels('锁定','Locked'),fm.trials[1].locks.join(' · ')),cut(fm.trials[1].metrics.cut)])),
        beat(`接下来试探 C，收益为 ${signed(fm.trials[2].trialGain)}。暂时变差的状态仍属于本轮轨迹。`,`The trial move of C gains ${signed(fm.trials[2].trialGain)}. The pass can temporarily get worse.`,event(fm.trials[2],[row(labels('本步增益','Trial gain'),signed(fm.trials[2].trialGain),'rose'),cut(fm.trials[2].metrics.cut)]))),
      chapter('最佳前缀决定保留哪些移动','The best prefix selects accepted moves',
        beat(`累计收益峰值是 ${Math.max(...fm.accepted.prefix.gains)}，出现在第 ${fm.accepted.prefix.bestK} 步。`,`The cumulative gain peaks at ${Math.max(...fm.accepted.prefix.gains)} after ${fm.accepted.prefix.bestK} moves.`,chart(labels('累计增益含空前缀','Cumulative gain including the empty prefix'),fm.accepted.prefix.gains.map((v,i)=>row(String(i),v)),fm.accepted.prefix.bestK)),
        beat(`恢复到前两步之后。最终接受 ${grouping(fm.accepted.assignment)}，cut 为 ${fm.accepted.metrics.cut}。`,`Restore the state after the first two moves. Accept ${grouping(fm.accepted.assignment)} with cut ${fm.accepted.metrics.cut}.`,event(fm.accepted,[groups(fm.accepted.assignment),row(labels('保留步数','Accepted moves'),fm.accepted.prefix.bestK,'teal'),cut(fm.accepted.metrics.cut)],{from:fm.trials.at(-1).assignment}))),
      chapter('到实验里改变平衡窗口','Vary the balance window in the lab',
        beat('严格等人数时，单点换侧会破坏等式。KL 的成对交换仍保持人数。','Under strict equal counts, a single move breaks equality. A KL pair swap preserves the counts.',cards(labels('两种改进邻域','Two refinement neighborhoods'),row('FM',labels('单点移动','One vertex moves'),'teal'),row('KL',labels('成对交换','Two vertices swap'),'blue'))),
        beat('在实验里改人数差阈值，观察合法候选和最佳前缀随之改变。','Change the allowed count gap and observe the legal candidates and best prefix in the lab.',event(fm.accepted,[counts(fm.accepted.metrics.counts),row(labels('实验变量','Lab parameter'),'maxDiff','gold')]))),
    ],
  },
  '06': {
    title: labels('谱二分','Spectral bisection'),
    description: labels('从拉普拉斯矩阵构造谱排序，再扫描可行切口。','Build a spectral order from the Laplacian and sweep feasible cuts.'),
    scenes: [
      chapter('把连接写进矩阵','Write connections into a matrix',
        beat('把边权填入邻接矩阵。每一行的权重和给出该点的加权度。','Put edge weights into the adjacency matrix. Each row sum gives the weighted degree.',diagram(BAD,[row(local,'A–E'),row(labels('边权','Edge weight'),'A[u,v]'),row(labels('度','Degree'),'D[u,u] = Σ A[u,v]','teal')])),
        beat('拉普拉斯 L = D − A。对角线是度，非对角项是负边权，每行和为零。','The Laplacian L = D − A has degrees on the diagonal, negative edge weights elsewhere and zero row sums.',{type:'matrix',heading:labels('拉普拉斯矩阵','Laplacian matrix'),values:spectral.events[0].matrix,names:spectral.events[0].ids})),
      chapter('把向量变成排序','Turn the vector into an order',
        beat('取第二小特征值对应的向量，每个节点获得一个坐标。','Take an eigenvector for the second-smallest eigenvalue. Each vertex gets one coordinate.',{type:'order',heading:labels('Fiedler 坐标','Fiedler coordinates'),names:spectral.events[1].order,values:spectral.events[1].order.map(id=>spectral.events[1].vector[spectral.events[0].ids.indexOf(id)].toFixed(3))}),
        beat(`按坐标从小到大，顺序为 ${spectral.result.order.join('、')}。向量翻号会把顺序反过来。`,`Sort the coordinates to get ${spectral.result.order.join(', ')}. Negating the vector reverses this order.`,{type:'order',heading:labels('从小到大的排序','Ascending order'),names:spectral.result.order})),
      chapter('扫描每个合法前缀','Sweep each legal prefix',
        beat('沿排序尝试相邻点之间的切口。两侧要满足给定人数窗口。','Try gaps between consecutive vertices. Both parts must meet the count window.',{type:'order',heading:labels('依次移动切线','Sweep the separator'),names:spectral.result.order,sweep:true}),
        beat(`本例合法前缀的 cut 依次为 ${spectral.result.sweep.map(s=>s.cut).join('、')}。保留最小项。`,`The legal prefix costs are ${spectral.result.sweep.map(s=>s.cut).join(', ')}. Choose the lowest-cost entry.`,chart(labels('前缀长度与割代价','Prefix length and cut cost'),spectral.result.sweep.map(s=>row('k = '+s.k,s.cut)),spectral.result.sweep.findIndex(s=>s.k===spectral.result.bestK)))),
      chapter('读取谱切割的结果','Read the spectral result',
        beat(`在第 ${spectral.result.bestK} 个点之后切开。得到 ${grouping(spectral.result.assignment)}，cut 为 ${spectral.result.metrics.cut}。`,`Cut after vertex ${spectral.result.bestK}: ${grouping(spectral.result.assignment)}, with cut ${spectral.result.metrics.cut}.`,diagram(spectral.result.assignment,[groups(spectral.result.assignment),counts(spectral.result.metrics.counts),cut(spectral.result.metrics.cut)])),
        beat('这个结果来自一条谱排序的扫描。小图可再用精确枚举校准。','The result comes from sweeping one spectral order. Check small instances against exact enumeration.',cards(labels('两种验证层次','Two levels of verification'),row(labels('向量','Eigenvector'),labels('检查特征方程','Check the eigen-equation'),'teal'),row(labels('离散分组','Discrete split'),labels('与精确枚举比较','Compare with exact enumeration'),'gold')))),
      chapter('用实验改变输入','Change the input in the lab',
        beat('断连图可能有多个零特征值，此时排序方向可能不唯一。','A disconnected graph can have several zero eigenvalues, so its ordering direction can be non-unique.',cards(labels('诊断信息','Diagnostics'),row(labels('图连通性','Connectivity'),labels('检查连通分量','Inspect components')),row(labels('特征值','Eigenvalues'),labels('留意重复值','Look for repeated values')))),
        beat('调整人数窗口，检查切口是否合法。下一章把二分用到选中的子图。','Vary the count window and check which cuts remain legal. Next, bisect a selected subgraph.',diagram(spectral.result.assignment,[groups(spectral.result.assignment),row(labels('下一章','Next lesson'),labels('递归二分','Recursive bisection'),'gold')]))),
    ],
  },
  '07': {
    title: labels('递归二分','Recursive bisection'),
    description: labels('在诱导子图上重算二分，并累计全图新增跨边。','Recompute splits on induced subgraphs and add newly crossing edges in the full graph.'),
    scenes: [
      chapter('从一组走向三组','From one part to three',
        beat('目标是三组。先把全部节点作为一个待拆分的组。','Aim for three parts. Start with all vertices together in one part.',event(r0,[groups(r0.assignment),row(labels('目标组数','Target parts'),3,'gold')])),
        beat('每轮挑选人数最多的组。人数相同时按组编号选，保证结果可复现。','At each step, choose the largest part by vertex count. Break ties by part ID.',cards(labels('递归规则','Recursive rule'),row(labels('选择','Select'),labels('当前最大组','Current largest part'),'teal'),row(labels('求解','Solve'),labels('在诱导子图上二分','Bisect its induced subgraph'),'gold')))),
      chapter('第一次在全图上切','First split the full graph',
        beat(`谱二分先得到 ${grouping(r1.assignment)}。全图 cut 增加 ${r1.addedCut}。`,`Spectral bisection gives ${grouping(r1.assignment)} and adds ${r1.addedCut} to the full-graph cut.`,event(r1,[groups(r1.assignment),row(labels('新增跨边权重','New crossing weight'),r1.addedCut,'gold'),cut(r1.metrics.cut)],{focus:edges(r1.metrics.cutEdges)})),
        beat('现在 ABC 人数最多。下一次只保留 ABC 内部的节点和边。','ABC is now the largest part. The next solve uses only its vertices and internal edges.',event(r1,[row(labels('选择子图','Chosen subgraph'),'ABC','gold'),row(labels('内部边','Internal edges'),'AB · AC · BC'),row(labels('已分出的组','Other part'),'DE')]))),
      chapter('子图重新计算谱排序','Recompute the order inside the subgraph',
        beat(`ABC 子图重算后的谱顺序为 ${r2.order.join('、')}，切出 ${r2.children[0].join('')} 和 ${r2.children[1].join('')}。`,`The recomputed order is ${r2.order.join(', ')}, separating ${r2.children[0].join('')} from ${r2.children[1].join('')}.`,{type:'order',heading:labels('ABC 诱导子图','Induced subgraph ABC'),names:r2.order,separator:r2.children[0].length}),
        beat(`这一步新增 ${r2.addedCut}。DE 仍是原来的组，先前的跨边继续计入总和。`,`This split adds ${r2.addedCut}. DE stays together, and earlier crossing edges still count.`,event(r2,[groups(r2.assignment),row(labels('本步新增','New cut'),r2.addedCut,'gold'),cut(r2.metrics.cut)]))),
      chapter('检查累计账本','Check the cut ledger',
        beat(`全图 cut 从 ${r0.metrics.cut} 到 ${r1.metrics.cut}，再到 ${r2.metrics.cut}。每条边在首次分开时计入。`,`The full-graph cut rises from ${r0.metrics.cut} to ${r1.metrics.cut} to ${r2.metrics.cut}. Count each edge when first separated.`,chart(labels('每次分裂后的全图 cut','Full-graph cut after each split'),[r0,r1,r2].map(e=>row(String(e.index),e.metrics.cut)),2)),
        beat('局部窗口只约束眼前的二分。最终三组的面积要重新检查。','A local window constrains the current split. Check the areas of the final three parts separately.',event(r2,[counts(r2.metrics.counts),areas(r2.metrics.areas),cut(r2.metrics.cut)]))),
      chapter('在分裂树上定位变化','Find the changes in the split tree',
        beat('回看第一次分裂，再查看 ABC 的子图。试着标出第二次新增的跨边。','Replay the first split, then inspect ABC. Identify the edges newly cut by the second split.',event(r2,[row(labels('第一层','First split'),'ABCDE → DE | ABC'),row(labels('第二层','Second split'),'ABC → C | AB','gold')],{from:r0.assignment})),
        beat('下一章用相同容量约束比较递归、轮转和交换改进。','Next, compare recursion, round robin and swap refinement under a common capacity.',event(r2,[groups(r2.assignment),row(labels('下一章','Next lesson'),labels('多路划分','Multiway partitioning'),'gold')]))),
    ],
  },
  '08': {
    title: labels('多路划分','Multiway partitioning'),
    description: labels('在同一容量约束下比较轮转、递归、交换和精确小图对照。','Compare round robin, recursion, swaps and an exact small-graph reference under one capacity.'),
    scenes: [
      chapter('先写清多路约束','Set the k-way contract',
        beat('本例目标三组，每组非空，面积容量为 2。先检验容量，再比较 cut。','Use three nonempty parts with area capacity 2. Verify capacity before comparing cuts.',cards(labels('对照契约','Comparison contract'),row('k',3,'teal'),row(labels('每组容量','Capacity per part'),2,'gold'),row(labels('目标','Objective'),labels('最小化割代价','Minimize cut cost')))),
        beat('所有方法用同一张 G01。结果需要为每个节点指定唯一组号。','Every method uses the same G01. Each result must assign every vertex to exactly one part.',event(r2,[row(local,'A–E'),groups(r2.assignment),areas(r2.metrics.areas)]))),
      chapter('轮转基线与递归构造','Round robin and recursive starts',
        beat(`轮转按输入顺序轮流放入三组，得到 ${grouping(roundRobin.result.assignment)}。`,`Round robin assigns input vertices cyclically, giving ${grouping(roundRobin.result.assignment)}.`,diagram(roundRobin.result.assignment,[groups(roundRobin.result.assignment),areas(roundRobin.result.metrics.areas),cut(roundRobin.result.metrics.cut)])),
        beat(`递归先看图结构，在本例得到 ${grouping(r2.assignment)}。两种分组都符合容量。`,`Recursion uses graph structure and gives ${grouping(r2.assignment)}. Both starts meet capacity here.`,event(r2,[groups(r2.assignment),areas(r2.metrics.areas),cut(r2.metrics.cut)]))),
      chapter('交换前检查容量','Validate swaps before considering gain',
        beat('对两组间的候选节点做一进一出。先验面积容量，再比较 cut 的下降。','Consider swapping two vertices from different parts. Check area capacity, then compare cut gains.',event(refined.events.at(-1),refined.events.at(-1).candidates.slice(0,4).map(c=>row(c.a+' ↔ '+c.b,signed(c.gain),'rose')))),
        beat('这里最佳合法交换仍无正收益，算法停在当前分组。','Here even the best legal swap has no positive gain, so the search stops at its current split.',diagram(refined.result.assignment,[groups(refined.result.assignment),row(labels('最佳合法交换增益','Best legal swap gain'),signed(refined.events.at(-1).candidates[0].gain),'rose'),cut(refined.result.metrics.cut)]))),
      chapter('小图精确对照','Calibrate with exact enumeration',
        beat(`轮转 cut 为 ${roundRobin.result.metrics.cut}，递归和交换改进在此例都是 ${refined.result.metrics.cut}。`,`Round robin costs ${roundRobin.result.metrics.cut}. Recursion and swap refinement both cost ${refined.result.metrics.cut} on this input.`,chart(labels('同一约束下的割代价','Cut costs under the same constraint'),[row(labels('轮转','Round robin'),roundRobin.result.metrics.cut),row(labels('递归','Recursive'),r2.metrics.cut),row(labels('递归后交换','After swaps'),refined.result.metrics.cut)],2)),
        beat(`精确枚举检查了 ${oracle.checked} 个可行无标号分组，最小 cut 是 ${oracle.best.cut}。`,`Exact enumeration checks ${oracle.checked} feasible unlabeled partitions. The minimum cut is ${oracle.best.cut}.`,diagram(oracle.best.assignment,[row(labels('可行分组数','Feasible splits'),oracle.checked),groups(oracle.best.assignment),cut(oracle.best.cut)]))),
      chapter('改变面积再做对照','Change an area and compare again',
        beat('容量按面积计算。改动单点面积后，即使人数不变，也要复核各组。','Capacity uses area. Change a vertex size and recheck the parts even when counts stay fixed.',diagram(r2.assignment,[counts(r2.metrics.counts),areas(metrics(resized,r2.assignment,3,2).areas),row(labels('容量','Capacity'),2,'rose')],{sizes:{A:4}})),
        beat('到比较台重跑三种构造方法。记录输入、容量、可行性和 cut。','Re-run the three methods in the comparison lab. Record the input, capacity, feasibility and cut.',cards(labels('可复核的比较','A reproducible comparison'),row(labels('固定','Fix'),labels('输入、组数与容量','Input, part count and capacity'),'teal'),row(labels('记录','Record'),labels('可行性与割代价','Feasibility and cut cost'),'gold')))),
    ],
  },
};

const output = new URL('../../video/lessons/', import.meta.url);
mkdirSync(output, {recursive:true});
writeFileSync(new URL('storyboards.json', output), JSON.stringify({graph, films},null,2)+'\n');
console.log('Exported seven bilingual storyboards from the course engines.');
