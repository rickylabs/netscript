/**
 * Bench runner: executes one task attempt (single repeat) with full turn
 * accounting.
 *
 * For each assistant turn the driver yields, the runner:
 *   1. accumulates token usage and prices cumulative cost,
 *   2. runs the frozen suite against the post-turn sandbox state,
 *   3. records the best observed pass rate, and
 *   4. detects the first fully-green turn (`turns_to_green`).
 *
 * The loop enforces the turn and wall-clock caps and always disposes the
 * sandbox. Every port is injected so the whole runner is unit-testable with a
 * fake driver and a fake test runner — no live agent, no real service.
 *
 * @module
 */

import type { AgentRunRequest, TokenUsage } from '../../domain/agent.ts';
import { addUsage, ZERO_USAGE } from '../../domain/agent.ts';
import type { Metrics } from '../../domain/metrics.ts';
import type { RunManifest } from '../../domain/manifest.ts';
import type { AnchorTable, WeightPreset } from '../../domain/scoring.ts';
import type { BenchTask, FrameworkLane } from '../../domain/task.ts';
import type {
  RawTraceRecord,
  RunStopCause,
  TaskAttemptResult,
  TurnObservation,
} from '../../domain/report.ts';
import type { AgentDriver } from '../../ports/agent-driver.ts';
import type { Clock } from '../../ports/clock.ts';
import type { SandboxProvider } from '../../ports/sandbox.ts';
import type { TestRunner } from '../../ports/test-runner.ts';
import type { TokenMeter } from '../../ports/token-meter.ts';
import { scoreMetrics } from '../scoring/scorer.ts';

/** Caps applied to a single task attempt. */
export interface RunCaps {
  readonly maxTurns: number;
  readonly maxWallSeconds: number;
  /** Per-suite evaluation timeout in milliseconds. */
  readonly suiteTimeoutMs: number;
}

/** Ports the runner depends on. */
export interface BenchRunnerDeps {
  readonly driver: AgentDriver;
  readonly sandboxes: SandboxProvider;
  readonly testRunner: TestRunner;
  readonly tokenMeter: TokenMeter;
  readonly clock: Clock;
}

/** Everything needed to run one task attempt. */
export interface TaskAttemptInput {
  readonly task: BenchTask;
  readonly lane: FrameworkLane;
  readonly manifest: RunManifest;
  readonly repeat: number;
  readonly model: string;
  readonly prompt: string;
  readonly caps: RunCaps;
  readonly anchors: AnchorTable;
  readonly preset: WeightPreset;
}

/** The paired output of a task attempt: heavy trace + light scored result. */
export interface TaskAttemptOutput {
  readonly trace: RawTraceRecord;
  readonly result: TaskAttemptResult;
}

/**
 * A runner bound to a set of ports. Construct once via
 * {@link createBenchRunner}; call {@link BenchRunner.runTask} per attempt.
 */
export interface BenchRunner {
  runTask(input: TaskAttemptInput): Promise<TaskAttemptOutput>;
}

class DefaultBenchRunner implements BenchRunner {
  readonly #deps: BenchRunnerDeps;

  constructor(deps: BenchRunnerDeps) {
    this.#deps = deps;
  }

  async runTask(input: TaskAttemptInput): Promise<TaskAttemptOutput> {
    const { driver, sandboxes, testRunner, tokenMeter, clock } = this.#deps;
    const startMs = clock.monotonicMs();

    const sandbox = await sandboxes.create({
      taskId: input.task.id,
      taskDir: input.task.dir,
    });

    const observations: TurnObservation[] = [];
    let cumulativeUsage: TokenUsage = ZERO_USAGE;
    let bestPassRate = 0;
    let turnsToGreen: number | null = null;
    let stopCause: RunStopCause = 'agent-ended';

    const request: AgentRunRequest = {
      model: input.model,
      prompt: input.prompt,
      workdir: sandbox.workdir,
      maxTurns: input.caps.maxTurns,
      maxWallSeconds: input.caps.maxWallSeconds,
    };

    try {
      for await (const turn of driver.run(request)) {
        // Cap: turn budget. The observation index is 0-based; a full budget of
        // N turns permits indices 0..N-1.
        if (observations.length >= input.caps.maxTurns) {
          stopCause = 'max-turns';
          break;
        }

        cumulativeUsage = addUsage(cumulativeUsage, turn.usage);
        const cumulativeCost = tokenMeter.price(cumulativeUsage);

        const testResult = await testRunner.run({
          taskId: input.task.id,
          workdir: sandbox.workdir,
          suitePath: input.task.testSuitePath,
          timeoutMs: input.caps.suiteTimeoutMs,
        });

        if (testResult.passRate > bestPassRate) bestPassRate = testResult.passRate;

        const firstGreen = testResult.green && turnsToGreen === null;
        if (firstGreen) turnsToGreen = observations.length + 1;

        observations.push({ turn, testResult, cumulativeCost, firstGreen });

        if (turnsToGreen !== null) {
          stopCause = 'green';
          break;
        }

        // Cap: wall clock. Checked after each turn so a slow suite still counts.
        const elapsedSeconds = (clock.monotonicMs() - startMs) / 1000;
        if (elapsedSeconds >= input.caps.maxWallSeconds) {
          stopCause = 'max-wall';
          break;
        }
      }
    } catch (error) {
      stopCause = 'error';
      await sandboxes.dispose(sandbox);
      throw error;
    }

    await sandboxes.dispose(sandbox);

    const wallSeconds = (clock.monotonicMs() - startMs) / 1000;
    const cost = tokenMeter.price(cumulativeUsage);

    const metrics: Metrics = {
      testPassRate: bestPassRate,
      turnsToGreen,
      cost,
      wallSeconds,
      // Report-only; net LOC measurement of the solution is deferred to 1b when
      // a real sandbox diff exists (fake runs have no authored solution).
      linesOfCode: 0,
    };

    const score = scoreMetrics(metrics, input.preset, input.anchors);

    const trace: RawTraceRecord = {
      manifest: input.manifest,
      taskId: input.task.id,
      laneId: input.lane.id,
      repeat: input.repeat,
      observations,
      stopCause,
    };

    const result: TaskAttemptResult = {
      manifest: input.manifest,
      taskId: input.task.id,
      laneId: input.lane.id,
      repeat: input.repeat,
      metrics,
      score,
      stopCause,
      turns: observations.length,
    };

    return { trace, result };
  }
}

/** Construct a {@link BenchRunner} bound to the given ports. */
export function createBenchRunner(deps: BenchRunnerDeps): BenchRunner {
  return new DefaultBenchRunner(deps);
}
