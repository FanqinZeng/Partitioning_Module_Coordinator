import test from 'node:test';
import assert from 'node:assert/strict';
import {filmHints} from '../site/assets/film-hints.js';

test('cut hints identify the crossing edges without supplying the final sum', () => {
  const hints = filmHints('cut');
  assert.equal(hints.length, 2);
  for (const language of [0, 1]) {
    assert.match(hints[0][language], /A–B/);
    assert.match(hints[0][language], /B–C/);
    for (const edge of ['A–B (5)', 'A–C (1)', 'C–E (1)', 'D–E (5)'])
      assert.ok(hints[1][language].includes(edge));
    assert.doesNotMatch(hints[1][language], /B–C|C–D|12/);
  }
});

test('capacity hints follow all 32 learner assignments, including empty and feasible parts', () => {
  const nodes = ['A','B','C','D','E'];
  let feasibleCount = 0;
  for (let mask = 0; mask < 32; mask++) {
    const assignment = Object.fromEntries(nodes.map((id,i) => [id, (mask >> i) & 1]));
    const original = {...assignment};
    const counts = [0,0], areas = [0,0];
    for (const id of nodes) {counts[assignment[id]]++; areas[assignment[id]] += id === 'A' ? 4 : 1;}
    const feasible = counts.every(n => n > 0) && areas.every(n => n <= 4);
    const [first, second] = filmHints('capacity', assignment);
    assert.deepEqual(assignment, original, 'requesting a hint must not move a vertex');
    for (const text of first) {
      assert.ok(text.includes(counts.join(' / ')));
      assert.ok(text.includes(areas.join(' / ')));
    }
    if (feasible) {
      feasibleCount++;
      assert.match(second[0], /已经非空且满足容量/);
      assert.match(second[1], /now nonempty and within capacity/);
    } else {
      const companions = nodes.filter(id => id !== 'A' && assignment[id] === assignment.A);
      assert.ok(companions.length > 0);
      assert.ok(second[0].includes(`组 ${assignment.A}`));
      assert.ok(second[0].includes(companions.join('、')));
      assert.ok(second[1].includes(`part ${assignment.A}`));
      assert.ok(second[1].includes(companions.join(', ')));
      // Independently verify that the suggested moves actually meet capacity.
      for (const id of companions) assignment[id] = 1 - assignment[id];
      const repaired = [0,0];
      for (const id of nodes) repaired[assignment[id]] += id === 'A' ? 4 : 1;
      assert.deepEqual(repaired, [4,4]);
    }
  }
  assert.equal(feasibleCount, 2);
  assert.throws(() => filmHints('unknown'));
});
