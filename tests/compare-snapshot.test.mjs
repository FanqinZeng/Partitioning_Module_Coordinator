import test from 'node:test';
import assert from 'node:assert/strict';
import {G01, run} from '../site/engines/course.js';
import {prepareComparison, comparisonFragment, readComparisonFragment} from '../site/assets/compare-snapshot.js';

test('a comparison link preserves the graph, vertex order and capacity of a completed run', () => {
  const graph = {
    nodes: ['E', 'A', 'D', 'B', 'C'],
    edges: G01.edges.map(({u, v, w}) => [u, v, u === 'A' && v === 'B' ? 1 : w]),
  };
  const snapshot = prepareComparison(graph, 4, 1.5);
  const link = comparisonFragment(snapshot);
  graph.edges[0][2] = 100;
  const restored = readComparisonFragment(link);
  assert.deepEqual(restored, snapshot);
  const compare = ({graph, k, capacity}) => run('multiway', graph, {k, capacity, strategy: 'round-robin'}).result;
  assert.deepEqual(compare(restored), compare(snapshot));

  const unlimited = prepareComparison(G01, 3, null);
  assert.equal(readComparisonFragment(comparisonFragment(unlimited)).capacity, null);
});

test('old anchors still work and broken or invalid comparison links are rejected', () => {
  assert.equal(readComparisonFragment('#main'), null);
  assert.throws(() => readComparisonFragment('#comparison=v0.AAAA'));
  assert.throws(() => readComparisonFragment('#comparison=v1.broken'));
  assert.throws(() => readComparisonFragment('#comparison=v1.' + 'a'.repeat(8193)));
  assert.throws(() => readComparisonFragment(comparisonFragment({k:3, capacity:2})));
  assert.throws(() => readComparisonFragment(comparisonFragment({graph:G01, k:6, capacity:2})));
  assert.throws(() => readComparisonFragment(comparisonFragment({graph:G01, k:3, capacity:0})));
  assert.throws(() => readComparisonFragment(comparisonFragment({
    graph:{nodes:['A','B'], edges:[['A','C',1]]}, k:2, capacity:null,
  })));
});
