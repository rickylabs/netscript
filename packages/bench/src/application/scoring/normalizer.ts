/**
 * Min-max normalizer. Maps a raw metric value onto [0, 1] against fixed anchors
 * where `worst` -> 0 and `best` -> 1. Handles both ascending anchors
 * (`worst < best`, e.g. pass rate 0 -> 1) and descending anchors
 * (`worst > best`, e.g. turns 80 -> 5) with the same formula, and clamps out of
 * range so values beyond the anchors saturate rather than exceed [0, 1].
 *
 * @module
 */

import type { AnchorTable, NormalizationAnchor } from '../../domain/scoring.ts';

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Normalize `value` against a `worst -> best` anchor into [0, 1].
 *
 * The formula `(value - worst) / (best - worst)` is direction-agnostic: for a
 * descending metric (`best < worst`) both numerator and denominator flip sign,
 * so a value at `best` still maps to 1 and a value at `worst` to 0. A
 * degenerate anchor (`worst === best`) yields 0 to avoid division by zero.
 */
export function normalize(value: number, anchor: NormalizationAnchor): number {
  const span = anchor.best - anchor.worst;
  if (span === 0) return 0;
  return clamp((value - anchor.worst) / span, 0, 1);
}

/**
 * Normalize a metric by key. `turnsToGreen === null` (never reached) scores 0.
 */
export function normalizeMetric(
  key: keyof AnchorTable,
  value: number | null,
  anchors: AnchorTable,
): number {
  if (value === null) return 0;
  return normalize(value, anchors[key]);
}
