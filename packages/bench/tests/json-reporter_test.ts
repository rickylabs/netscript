import { assertEquals } from '@std/assert';
import { JsonReporter } from '../src/adapters/reporting/json-reporter.ts';
import { MarkdownSummaryReporter } from '../src/adapters/reporting/markdown-summary.ts';
import { BufferSink } from '../src/ports/output-sink.ts';
import { buildRunSummary } from '../src/application/runner/summarize.ts';
import { scoreMetrics } from '../src/application/scoring/scorer.ts';
import { ANCHORS, DEFAULT_PRESET } from '../bench.config.ts';
import type { Metrics } from '../src/domain/metrics.ts';
import type { RunManifest } from '../src/domain/manifest.ts';
import type { RunSummary, TaskAttemptResult } from '../src/domain/report.ts';

const MANIFEST: RunManifest = {
  runId: 'run-1',
  startedAt: new Date(0).toISOString(),
  model: 'claude-opus-4-8',
  claudeCodeVersion: 'unknown',
  frameworkVersion: '0.0.1-alpha.19',
  denoVersion: 'test',
  lockfileHash: 'abc',
  seed: 1,
  weightsPreset: 'default',
  fake: true,
};

function sampleSummary(): RunSummary {
  const metrics: Metrics = {
    testPassRate: 1,
    turnsToGreen: 3,
    cost: 0.035,
    wallSeconds: 12.5,
    linesOfCode: 88,
  };
  const attempt: TaskAttemptResult = {
    manifest: MANIFEST,
    taskId: 't1-storefront-api',
    laneId: 'netscript',
    repeat: 1,
    metrics,
    score: scoreMetrics(metrics, DEFAULT_PRESET, ANCHORS),
    stopCause: 'green',
    turns: 3,
  };
  return buildRunSummary(MANIFEST, [attempt]);
}

Deno.test('JSON reporter round-trips a run summary losslessly', async () => {
  const summary = sampleSummary();
  const sink = new BufferSink();
  await new JsonReporter(sink).report(summary);

  const parsed = JSON.parse(sink.toString()) as RunSummary;
  assertEquals(parsed.manifest.runId, 'run-1');
  assertEquals(parsed.attempts.length, 1);
  assertEquals(parsed.attempts[0].metrics.turnsToGreen, 3);
  assertEquals(parsed.attempts[0].score.provisional, true);
  assertEquals(parsed.meanComposite, summary.meanComposite);
  assertEquals(parsed.provisional, true);
});

Deno.test('markdown reporter renders a table row per attempt and flags provisional', async () => {
  const summary = sampleSummary();
  const sink = new BufferSink();
  await new MarkdownSummaryReporter(sink).report(summary);

  const md = sink.toString();
  assertEquals(md.includes('# Bench run run-1'), true);
  assertEquals(md.includes('t1-storefront-api | netscript'), true);
  assertEquals(md.includes('Provisional'), true);
  assertEquals(md.includes('Fake driver'), true);
});
