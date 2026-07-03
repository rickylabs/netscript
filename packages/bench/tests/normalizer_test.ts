import { assertAlmostEquals, assertEquals } from '@std/assert';
import { clamp, normalize, normalizeMetric } from '../src/application/scoring/normalizer.ts';
import { ANCHORS } from '../bench.config.ts';

Deno.test('clamp bounds values into range', () => {
  assertEquals(clamp(-1, 0, 1), 0);
  assertEquals(clamp(2, 0, 1), 1);
  assertEquals(clamp(0.4, 0, 1), 0.4);
});

Deno.test('ascending anchor maps worst->0, best->1, midpoint->0.5', () => {
  const anchor = { worst: 0, best: 1 };
  assertEquals(normalize(0, anchor), 0);
  assertEquals(normalize(1, anchor), 1);
  assertEquals(normalize(0.5, anchor), 0.5);
});

Deno.test('descending anchor (turns 80->5) maps best->1, worst->0', () => {
  const anchor = ANCHORS.turnsToGreen; // worst 80, best 5
  assertEquals(normalize(5, anchor), 1);
  assertEquals(normalize(80, anchor), 0);
  // midpoint of the 5..80 span is 42.5 -> 0.5
  assertAlmostEquals(normalize(42.5, anchor), 0.5, 1e-9);
});

Deno.test('descending anchor clamps beyond best and worst', () => {
  const anchor = ANCHORS.cost; // worst 2.00, best 0.05
  assertEquals(normalize(0.0, anchor), 1); // cheaper than best -> saturates at 1
  assertEquals(normalize(5.0, anchor), 0); // costlier than worst -> saturates at 0
});

Deno.test('wall anchor 900->60 endpoints', () => {
  const anchor = ANCHORS.wallSeconds;
  assertEquals(normalize(60, anchor), 1);
  assertEquals(normalize(900, anchor), 0);
});

Deno.test('degenerate anchor (worst === best) yields 0', () => {
  assertEquals(normalize(5, { worst: 5, best: 5 }), 0);
});

Deno.test('normalizeMetric treats null turns_to_green as 0', () => {
  assertEquals(normalizeMetric('turnsToGreen', null, ANCHORS), 0);
  assertEquals(normalizeMetric('turnsToGreen', 5, ANCHORS), 1);
});
