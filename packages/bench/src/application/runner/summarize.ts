/**
 * Run-summary aggregation: fold per-attempt scored results into the committed
 * {@link RunSummary} (mean composite + provisional flag).
 *
 * @module
 */

import type { RunManifest } from '../../domain/manifest.ts';
import type { RunSummary, TaskAttemptResult } from '../../domain/report.ts';

/** Aggregate task attempts into a run summary. */
export function buildRunSummary(
  manifest: RunManifest,
  attempts: readonly TaskAttemptResult[],
): RunSummary {
  const meanComposite = attempts.length === 0
    ? 0
    : attempts.reduce((sum, attempt) => sum + attempt.score.composite, 0) / attempts.length;
  const provisional = attempts.some((attempt) => attempt.score.provisional);
  return { manifest, attempts, meanComposite, provisional };
}
