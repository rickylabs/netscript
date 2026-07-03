/**
 * JSONL trace reporter: writes the heavy per-turn raw trace, one JSON object per
 * line. These land in `.llm/tmp/bench/<run-id>/` (gitignored); only the scored
 * summary is committed.
 *
 * @module
 */

import type { RawTraceRecord } from '../../domain/report.ts';
import type { OutputSink } from '../../ports/output-sink.ts';
import type { TraceReporter } from '../../ports/reporter.ts';

/** Emits a raw trace as newline-delimited JSON (header + one line per turn). */
export class JsonlTraceReporter implements TraceReporter {
  readonly #sink: OutputSink;

  constructor(sink: OutputSink) {
    this.#sink = sink;
  }

  async reportTrace(trace: RawTraceRecord): Promise<void> {
    const header = {
      kind: 'trace-header',
      runId: trace.manifest.runId,
      taskId: trace.taskId,
      laneId: trace.laneId,
      repeat: trace.repeat,
      stopCause: trace.stopCause,
    };
    const lines: string[] = [JSON.stringify(header)];
    for (const observation of trace.observations) {
      lines.push(JSON.stringify({ kind: 'turn', ...observation }));
    }
    await this.#sink.write(lines.join('\n') + '\n');
  }
}
