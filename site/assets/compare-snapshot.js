import {run} from '../engines/course.js';
import {L} from './i18n.js';

const KEY = '#comparison=';
const PREFIX = KEY + 'v1.';
const MAX_TOKEN_LENGTH = 8192;

export function prepareComparison(graph, k, capacity) {
  if (graph === undefined) throw Error(L('缺少图数据。', 'The graph is missing.'));
  const validated = run('initial', graph);
  if (validated.status === 'invalid') throw Error(validated.errors.join(' · '));
  if (!Number.isInteger(k) || k < 2 || k > Math.min(6, validated.graph.nodes.length)) {
    throw Error(L('组数须为 2 到 min(6, 节点数) 的整数。', 'Use an integer from 2 to min(6, vertex count).'));
  }
  if (capacity !== null && (!Number.isFinite(capacity) || capacity <= 0)) {
    throw Error(L('面积容量须为正数。', 'Area capacity must be positive.'));
  }
  return {graph: validated.graph, k, capacity};
}

// The normalized graph contains only ASCII vertex IDs and finite numeric values.
export function comparisonFragment(snapshot) {
  return PREFIX + btoa(JSON.stringify(snapshot)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function readComparisonFragment(hash) {
  if (!hash.startsWith(KEY)) return null;
  const token = hash.slice(PREFIX.length);
  if (!hash.startsWith(PREFIX) || token.length > MAX_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) {
    throw Error(L('比较链接格式无效。', 'The comparison link is invalid.'));
  }
  const {graph, k, capacity} = JSON.parse(atob(token.replaceAll('-', '+').replaceAll('_', '/')));
  return prepareComparison(graph, k, capacity);
}
