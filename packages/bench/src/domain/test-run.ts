/**
 * Test-execution domain types: a single probe result and an aggregate suite
 * result. These are the observations the runner records after each agent turn.
 *
 * @module
 */

/** Verdict for a single probe within a frozen suite. */
export type ProbeVerdict = 'pass' | 'fail' | 'skip';

/** Result of one frozen-suite probe run against the service under test. */
export interface ProbeResult {
  /** Stable probe id, e.g. `create-product`. */
  readonly id: string;
  /** Human-readable probe title. */
  readonly title: string;
  readonly verdict: ProbeVerdict;
  readonly durationMs: number;
  /** Failure detail when {@link verdict} is `fail`. */
  readonly error?: string;
}

/**
 * Aggregate result of running the full frozen suite once. `green` is the
 * fully-passing condition the runner watches for to compute `turns_to_green`.
 */
export interface TestRunResult {
  /** Total probes attempted (excludes skipped from pass-rate denominator). */
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  /** passed / (total - skipped), in [0, 1]. Zero when nothing ran. */
  readonly passRate: number;
  /** True iff at least one probe ran and none failed. */
  readonly green: boolean;
  /** Wall time to run the suite. */
  readonly durationMs: number;
  /** Per-probe detail for the trace. */
  readonly probes: readonly ProbeResult[];
}

/**
 * Compute a {@link TestRunResult} aggregate from raw probe results. Keeps the
 * pass-rate / green invariants in one place so adapters cannot diverge.
 */
export function summarizeProbes(
  probes: readonly ProbeResult[],
  durationMs: number,
): TestRunResult {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for (const probe of probes) {
    if (probe.verdict === 'pass') passed += 1;
    else if (probe.verdict === 'fail') failed += 1;
    else skipped += 1;
  }
  const total = probes.length;
  const denominator = total - skipped;
  const passRate = denominator > 0 ? passed / denominator : 0;
  const green = denominator > 0 && failed === 0;
  return { total, passed, failed, skipped, passRate, green, durationMs, probes };
}
