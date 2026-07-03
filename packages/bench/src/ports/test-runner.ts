/**
 * TestRunner port: boots the candidate service and runs the frozen suite once,
 * returning an aggregate result.
 *
 * @module
 */

import type { TestRunResult } from '../domain/test-run.ts';

/** Request to evaluate the frozen suite against a task's current sandbox state. */
export interface TestRunRequest {
  readonly taskId: string;
  /** Absolute sandbox working directory holding the candidate solution. */
  readonly workdir: string;
  /** Absolute path to the frozen suite module for this task. */
  readonly suitePath: string;
  /** Per-suite wall-clock budget in milliseconds. */
  readonly timeoutMs: number;
}

/**
 * Runs a task's frozen black-box suite against a booted service. The real
 * adapter starts a NetScript service and probes it over HTTP; the runner treats
 * this as an opaque port so it is fully unit-testable with a fake.
 */
export interface TestRunner {
  run(request: TestRunRequest): Promise<TestRunResult>;
}
