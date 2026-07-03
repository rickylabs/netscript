/**
 * Reporter port: consumes a finished run summary and renders it to an
 * {@link OutputSink}. Multiple reporters (JSON, markdown, JSONL trace) can be
 * fanned out over the same run.
 *
 * @module
 */

import type { RawTraceRecord, RunSummary } from '../domain/report.ts';

/** Renders bench artifacts to an output sink. */
export interface Reporter {
  /** Render the scored run summary. */
  report(summary: RunSummary): Promise<void>;
}

/** Renders the heavy raw trace (JSONL) — separate seam from scored reporting. */
export interface TraceReporter {
  /** Render one task attempt's raw trace. */
  reportTrace(trace: RawTraceRecord): Promise<void>;
}
