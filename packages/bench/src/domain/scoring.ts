/**
 * Scoring domain types: normalization anchors, weight presets, rubric, and the
 * composite score shape.
 *
 * Normalization is min-max against fixed anchors so scores are comparable
 * across runs and (eventually) across framework lanes. Descending metrics
 * (turns, cost, wall) anchor worst -> best; ascending metrics (pass rate)
 * anchor 0 -> 1.
 *
 * @module
 */

/** The scored metric axes. `linesOfCode` is report-only (weight 0). */
export type MetricKey =
  | 'testPassRate'
  | 'turnsToGreen'
  | 'cost'
  | 'wallSeconds'
  | 'linesOfCode';

/**
 * Min-max anchors for one metric. `worst` normalizes to 0, `best` to 1. For
 * ascending metrics `worst < best`; for descending metrics `worst > best`.
 */
export interface NormalizationAnchor {
  readonly worst: number;
  readonly best: number;
}

/** The fixed anchor set (plan §Metrics). */
export type AnchorTable = Readonly<Record<Exclude<MetricKey, 'linesOfCode'>, NormalizationAnchor>>;

/**
 * A weight preset. Weights should sum to 1 across scored axes; `linesOfCode` is
 * always 0. The scorer does not renormalize — presets are authored to sum to 1.
 */
export interface WeightPreset {
  readonly id: string;
  readonly description: string;
  readonly weights: Readonly<Record<MetricKey, number>>;
}

/** A single rubric checklist item (provisional pending OQ1). */
export interface RubricItem {
  readonly id: string;
  readonly description: string;
  /** Weight within the rubric (rubric items sum to 1). */
  readonly weight: number;
}

/** A task's rubric: a weighted checklist scored 0..1 by a judge (Slice 5). */
export interface Rubric {
  readonly taskId: string;
  /** True while the checklist is provisional and not yet gating (OQ1). */
  readonly provisional: boolean;
  readonly items: readonly RubricItem[];
}

/** One normalized component of a composite score. */
export interface ScoreComponent {
  readonly key: MetricKey;
  /** Raw metric value before normalization (null = unreached, e.g. turns). */
  readonly raw: number | null;
  /** Normalized value in [0, 1]. */
  readonly normalized: number;
  /** Weight applied from the active preset. */
  readonly weight: number;
  /** normalized * weight. */
  readonly contribution: number;
}

/** Composite score for one task attempt. */
export interface Score {
  /** Weight preset id used. */
  readonly presetId: string;
  /** Sum of component contributions, in [0, 1]. */
  readonly composite: number;
  /**
   * True while the composite excludes the rubric axis (Slice 1). A provisional
   * composite is directional only and must not be published as a final verdict.
   */
  readonly provisional: boolean;
  readonly components: readonly ScoreComponent[];
}
