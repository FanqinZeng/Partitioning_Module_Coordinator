import {BAD, G01, GOOD, metrics} from '../engines/course.js';

export const FILM_CAPACITY = 4;
export const FILM_CAPACITY_GRAPH = {
  ...G01,
  nodes: G01.nodes.map(node => node.id === 'A' ? {...node, size: 4} : node),
};

// The same graph and evaluator drive both feedback and hints. Hints do not
// change a learner's assignment or supply a cut total before they submit it.
export function filmHints(kind, assignment = GOOD) {
  if (kind === 'cut') {
    const {cutEdges} = metrics(G01, BAD);
    const cross = cutEdges[0];
    const inside = G01.edges.find(edge => BAD[edge.u] === BAD[edge.v]);
    const edges = cutEdges.map(({u,v,w}) => `${u}–${v} (${w})`).join(' + ');
    return [
      [`先逐边看组号。例如 ${cross.u}–${cross.v} 的两端异组，要计入；${inside.u}–${inside.v} 同组，不计入。`,
       `Check the part labels at each end. For example, ${cross.u}–${cross.v} crosses parts and counts; ${inside.u}–${inside.v} stays within one part and does not.`],
      [`要累加的边是 ${edges}。每条只算一次，请自行求和后重新提交。`,
       `Add these edges: ${edges}. Count each once, then calculate the sum and submit again.`],
    ];
  }
  if (kind !== 'capacity') throw new Error('Unknown film activity');
  const {counts, areas, feasible} = metrics(FILM_CAPACITY_GRAPH, assignment, 2, FILM_CAPACITY);
  const full = FILM_CAPACITY_GRAPH.nodes.find(node => node.size === FILM_CAPACITY);
  const companions = FILM_CAPACITY_GRAPH.nodes.filter(node =>
    node.id !== full.id && assignment[node.id] === assignment[full.id]).map(node => node.id);
  return [
    [`当前组 0 / 组 1 的人数是 ${counts.join(' / ')}，面积是 ${areas.join(' / ')}。容量 ${FILM_CAPACITY} 检查的是面积，不是人数。移动节点后，这些数值也会更新。`,
     `Parts 0 / 1 currently have counts ${counts.join(' / ')} and areas ${areas.join(' / ')}. Capacity ${FILM_CAPACITY} limits area, not vertex count. These values update when you move a vertex.`],
    feasible
      ? ['当前两组已经非空且满足容量。点击「检查容量」验证，再继续观看。',
         'Both parts are now nonempty and within capacity. Select Check capacity to verify, then continue watching.']
      : [`${full.id} 自身面积为 ${full.size}，已经占满组 ${assignment[full.id]} 的容量。同组还有 ${companions.join('、')}；试着将它们移到另一组，再检查两组面积。`,
         `${full.id} alone has area ${full.size}, filling part ${assignment[full.id]}. ${companions.join(', ')} also share that part. Try moving them to the other part, then check both areas.`],
  ];
}
