/**
 * Fixture test runner: returns a scripted sequence of {@link TestRunResult}s,
 * one per call, simulating a service that goes from red to green over turns.
 * Used by the fake `bench:self --fake` demo and by runner unit tests — it needs
 * no service and no agent.
 *
 * @module
 */

import { summarizeProbes } from '../../domain/test-run.ts';
import type { ProbeResult, TestRunResult } from '../../domain/test-run.ts';
import type { TestRunner, TestRunRequest } from '../../ports/test-runner.ts';

/** Build a {@link TestRunResult} where `passed` of `total` probes pass. */
export function fixtureResult(passed: number, total: number, durationMs = 5): TestRunResult {
  const probes: ProbeResult[] = [];
  for (let i = 0; i < total; i += 1) {
    const pass = i < passed;
    probes.push({
      id: `probe-${i}`,
      title: `probe ${i}`,
      verdict: pass ? 'pass' : 'fail',
      durationMs: 1,
      error: pass ? undefined : 'fixture failure',
    });
  }
  return summarizeProbes(probes, durationMs);
}

/** A {@link TestRunner} that replays a fixed list of results. */
export class FixtureTestRunner implements TestRunner {
  readonly #results: readonly TestRunResult[];
  #cursor = 0;

  constructor(results: readonly TestRunResult[]) {
    this.#results = results;
  }

  run(_request: TestRunRequest): Promise<TestRunResult> {
    const index = Math.min(this.#cursor, this.#results.length - 1);
    this.#cursor += 1;
    return Promise.resolve(this.#results[index]);
  }
}
