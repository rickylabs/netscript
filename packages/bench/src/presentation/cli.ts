/**
 * Bench CLI. Two run modes:
 *
 *   - `self`        — live agent run against the pinned model. Requires an API
 *                     key and is gated pending the cost/cadence decision (OQ2);
 *                     without `--fake` it exits with a clear, actionable error.
 *   - `self --fake` — runs the full pipeline with the deterministic fake driver
 *                     and fixture test runner. No key, no service — a pipeline
 *                     proof, never a benchmark result.
 *   - `conformance` — key-free CI gate that replays a golden reference against
 *                     the frozen suite. Pending until Slice 1b lands the golden
 *                     reference; currently prints a documented skipped status.
 *
 * @module
 */

import { Command } from '@cliffy/command';
import {
  ANCHORS,
  CAPS,
  DEFAULT_MODEL,
  DEFAULT_PRESET,
  pricingFor,
  TASKS,
} from '../../bench.config.ts';
import type { RunManifest } from '../domain/manifest.ts';
import type { TaskAttemptResult } from '../domain/report.ts';
import { createBenchRunner } from '../application/runner/bench-runner.ts';
import { buildRunSummary } from '../application/runner/summarize.ts';
import { FakeAgentDriver, type ScriptedTurn } from '../adapters/agent/fake-driver.ts';
import { fixtureResult, FixtureTestRunner } from '../adapters/test-runner/fixture-runner.ts';
import { LocalWorkspaceSandbox } from '../adapters/sandbox/local-workspace.ts';
import { PricingTokenMeter } from '../adapters/token-meter/pricing-token-meter.ts';
import { SystemClock } from '../adapters/clock/system-clock.ts';
import { MarkdownSummaryReporter } from '../adapters/reporting/markdown-summary.ts';
import { BufferSink } from '../ports/output-sink.ts';

function fakeManifest(): RunManifest {
  return {
    runId: `fake-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    startedAt: new Date().toISOString(),
    model: DEFAULT_MODEL,
    claudeCodeVersion: 'unknown',
    frameworkVersion: '0.0.1-alpha.19',
    denoVersion: Deno.version.deno,
    lockfileHash: 'fake',
    seed: 1,
    weightsPreset: DEFAULT_PRESET.id,
    fake: true,
  };
}

/** Scripted usage: modest per-turn tokens with cache reads after the first turn. */
function fakeScript(): ScriptedTurn[] {
  const first: ScriptedTurn = {
    usage: {
      inputTokens: 8000,
      outputTokens: 1500,
      cacheCreationTokens: 6000,
      cacheReadTokens: 0,
    },
    stopReason: 'tool_use',
  };
  const later: ScriptedTurn = {
    usage: {
      inputTokens: 1200,
      outputTokens: 900,
      cacheCreationTokens: 0,
      cacheReadTokens: 14000,
    },
    stopReason: 'tool_use',
  };
  return [first, later, later, later];
}

async function runFake(): Promise<void> {
  const manifest = fakeManifest();
  const attempts: TaskAttemptResult[] = [];

  for (const task of TASKS) {
    // Fixture goes red -> red -> green: turns_to_green = 3.
    const runner = createBenchRunner({
      driver: new FakeAgentDriver(fakeScript()),
      sandboxes: new LocalWorkspaceSandbox({ seedTaskFiles: false }),
      testRunner: new FixtureTestRunner([
        fixtureResult(2, 5),
        fixtureResult(4, 5),
        fixtureResult(5, 5),
      ]),
      tokenMeter: new PricingTokenMeter(pricingFor(manifest.model)),
      clock: new SystemClock(),
    });

    const { result } = await runner.runTask({
      task,
      lane: task.lanes[0],
      manifest,
      repeat: 1,
      model: manifest.model,
      prompt: `[fake] solve ${task.id}`,
      caps: CAPS,
      anchors: ANCHORS,
      preset: DEFAULT_PRESET,
    });
    attempts.push(result);
  }

  const summary = buildRunSummary(manifest, attempts);
  const sink = new BufferSink();
  await new MarkdownSummaryReporter(sink).report(summary);
  console.log(sink.toString());
}

function runLiveGuard(): never {
  console.error(
    [
      'bench self: live agent runs are gated pending the cost/key/cadence decision (OQ2).',
      '',
      'To exercise the pipeline now without an API key or a live service, run:',
      '    deno task cli self --fake',
      '',
      'Live runs land in Slice 1b behind an ANTHROPIC_API_KEY gate.',
    ].join('\n'),
  );
  Deno.exit(2);
}

function runConformance(): void {
  console.log(
    [
      'bench conformance: SKIPPED (pending).',
      '',
      'Conformance replays a committed golden NetScript reference against each',
      "task's frozen suite with no agent — a key-free CI gate. The golden",
      'reference is authored in Slice 1b; until then this step is intentionally',
      'a documented no-op and does not fail CI.',
    ].join('\n'),
  );
}

function createSelfCommand() {
  return new Command()
    .description('Run the self-bench (live, or --fake for a key-free pipeline proof).')
    .option('--fake', 'Use the deterministic fake driver + fixture runner (no key, no service).')
    .action(async (options: { fake?: boolean }) => {
      if (options.fake) {
        await runFake();
        return;
      }
      runLiveGuard();
    });
}

function createConformanceCommand() {
  return new Command()
    .description('Key-free conformance gate against the golden reference (pending Slice 1b).')
    .action(() => runConformance());
}

/** Build the CLI command tree. Bare invocation prints help. */
export function buildCli() {
  return new Command()
    .name('bench')
    .version('0.0.1-alpha.19')
    .description('@netscript/bench — NetScript self-bench instrument.')
    .command('self', createSelfCommand())
    .command('conformance', createConformanceCommand());
}

/** Parse and execute the CLI. */
export async function runCli(args: readonly string[]): Promise<void> {
  await buildCli().parse([...args]);
}
