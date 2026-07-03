/**
 * Markdown summary reporter: renders the committed `results/summary.md` view of
 * a run — a compact human-readable table of per-attempt metrics and scores.
 *
 * @module
 */

import type { RunSummary, TaskAttemptResult } from '../../domain/report.ts';
import type { OutputSink } from '../../ports/output-sink.ts';
import type { Reporter } from '../../ports/reporter.ts';

function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmtUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function fmtTurns(value: number | null): string {
  return value === null ? '—' : String(value);
}

function row(attempt: TaskAttemptResult): string {
  const m = attempt.metrics;
  return [
    attempt.taskId,
    attempt.laneId,
    String(attempt.repeat),
    fmtPct(m.testPassRate),
    fmtTurns(m.turnsToGreen),
    fmtUsd(m.cost),
    `${m.wallSeconds.toFixed(1)}s`,
    attempt.score.composite.toFixed(3),
    attempt.stopCause,
  ].join(' | ');
}

/** Renders a {@link RunSummary} as a Markdown report. */
export class MarkdownSummaryReporter implements Reporter {
  readonly #sink: OutputSink;

  constructor(sink: OutputSink) {
    this.#sink = sink;
  }

  async report(summary: RunSummary): Promise<void> {
    const { manifest } = summary;
    const lines: string[] = [];
    lines.push(`# Bench run ${manifest.runId}`);
    lines.push('');
    lines.push(`- Model: \`${manifest.model}\``);
    lines.push(`- Preset: \`${manifest.weightsPreset}\``);
    lines.push(`- Framework: \`${manifest.frameworkVersion}\` · Deno \`${manifest.denoVersion}\``);
    lines.push(`- Mean composite: **${summary.meanComposite.toFixed(3)}**`);
    if (summary.provisional) {
      lines.push('');
      lines.push('> Provisional: composite excludes the rubric axis (Slice 1). Directional only.');
    }
    if (manifest.fake) {
      lines.push('');
      lines.push('> Fake driver: pipeline proof, **not** a benchmark result.');
    }
    lines.push('');
    lines.push('| Task | Lane | Rep | Pass | Turns→green | Cost | Wall | Composite | Stop |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const attempt of summary.attempts) {
      lines.push(`| ${row(attempt)} |`);
    }
    lines.push('');
    await this.#sink.write(lines.join('\n'));
  }
}
