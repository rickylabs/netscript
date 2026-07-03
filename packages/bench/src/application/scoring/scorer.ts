/**
 * Composite scorer. Normalizes each metric against the anchor table, weights it
 * by the active preset, and sums the contributions into a composite in [0, 1].
 *
 * Slice 1 scope: the rubric axis is not yet computed, so every composite is
 * flagged `provisional`. `linesOfCode` is normalized report-only at weight 0 so
 * it never affects the composite. The normalizer and weighting are fully real
 * and unit-tested; only the rubric contribution is deferred.
 *
 * @module
 */

import type { Metrics } from '../../domain/metrics.ts';
import type {
  AnchorTable,
  MetricKey,
  Score,
  ScoreComponent,
  WeightPreset,
} from '../../domain/scoring.ts';
import { normalize, normalizeMetric } from './normalizer.ts';

/** The scored axes in composite order. `linesOfCode` is report-only. */
const SCORED_KEYS: readonly Exclude<MetricKey, 'linesOfCode'>[] = [
  'testPassRate',
  'turnsToGreen',
  'cost',
  'wallSeconds',
];

function rawFor(key: MetricKey, metrics: Metrics): number | null {
  switch (key) {
    case 'testPassRate':
      return metrics.testPassRate;
    case 'turnsToGreen':
      return metrics.turnsToGreen;
    case 'cost':
      return metrics.cost;
    case 'wallSeconds':
      return metrics.wallSeconds;
    case 'linesOfCode':
      return metrics.linesOfCode;
  }
}

/**
 * Score one metric bundle. `provisional` is always true in Slice 1 (no rubric).
 */
export function scoreMetrics(
  metrics: Metrics,
  preset: WeightPreset,
  anchors: AnchorTable,
): Score {
  const components: ScoreComponent[] = [];
  let composite = 0;

  for (const key of SCORED_KEYS) {
    const raw = rawFor(key, metrics);
    const normalized = key === 'testPassRate'
      ? normalize(metrics.testPassRate, anchors.testPassRate)
      : normalizeMetric(key, raw, anchors);
    const weight = preset.weights[key];
    const contribution = normalized * weight;
    composite += contribution;
    components.push({ key, raw, normalized, weight, contribution });
  }

  // Report-only lines-of-code axis: recorded, weight 0, never in composite.
  components.push({
    key: 'linesOfCode',
    raw: metrics.linesOfCode,
    normalized: 0,
    weight: preset.weights.linesOfCode,
    contribution: 0,
  });

  return {
    presetId: preset.id,
    composite,
    provisional: true,
    components,
  };
}
