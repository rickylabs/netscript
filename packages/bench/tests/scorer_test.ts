import { assertAlmostEquals, assertEquals } from '@std/assert';
import { scoreMetrics } from '../src/application/scoring/scorer.ts';
import { ANCHORS, DEFAULT_PRESET } from '../bench.config.ts';
import type { Metrics } from '../src/domain/metrics.ts';

Deno.test('perfect metrics score the sum of scored weights (0.80 with reserve)', () => {
  const metrics: Metrics = {
    testPassRate: 1,
    turnsToGreen: 5,
    cost: 0.05,
    wallSeconds: 60,
    linesOfCode: 120,
  };
  const score = scoreMetrics(metrics, DEFAULT_PRESET, ANCHORS);
  // 0.45 + 0.15 + 0.10 + 0.10 = 0.80 (rubric reserve 0.20 held out).
  assertAlmostEquals(score.composite, 0.8, 1e-9);
  assertEquals(score.provisional, true);
});

Deno.test('worst metrics score 0', () => {
  const metrics: Metrics = {
    testPassRate: 0,
    turnsToGreen: null,
    cost: 2.0,
    wallSeconds: 900,
    linesOfCode: 0,
  };
  const score = scoreMetrics(metrics, DEFAULT_PRESET, ANCHORS);
  assertAlmostEquals(score.composite, 0, 1e-9);
});

Deno.test('lines_of_code is report-only with weight 0 and no contribution', () => {
  const metrics: Metrics = {
    testPassRate: 1,
    turnsToGreen: 5,
    cost: 0.05,
    wallSeconds: 60,
    linesOfCode: 999,
  };
  const score = scoreMetrics(metrics, DEFAULT_PRESET, ANCHORS);
  const loc = score.components.find((c) => c.key === 'linesOfCode');
  assertEquals(loc?.weight, 0);
  assertEquals(loc?.contribution, 0);
  assertEquals(loc?.raw, 999);
});

Deno.test('each component contribution equals normalized * weight', () => {
  const metrics: Metrics = {
    testPassRate: 0.5,
    turnsToGreen: 42.5,
    cost: 1.0,
    wallSeconds: 480,
    linesOfCode: 50,
  };
  const score = scoreMetrics(metrics, DEFAULT_PRESET, ANCHORS);
  for (const component of score.components) {
    assertAlmostEquals(component.contribution, component.normalized * component.weight, 1e-12);
  }
});
