/**
 * Run manifest: the reproducibility envelope pinned around every bench run.
 *
 * A run is only comparable to another if these pins match. The manifest is
 * emitted into every raw trace and scored artifact so a result can be traced
 * back to the exact model, toolchain, and corpus state that produced it.
 *
 * @module
 */

/** Provenance pins that must match for two runs to be comparable (OQ5). */
export interface RunManifest {
  /** Unique id for this run (timestamped, sortable). */
  readonly runId: string;
  /** ISO-8601 UTC timestamp the run started. */
  readonly startedAt: string;
  /** Pinned model id, e.g. `claude-opus-4-8`. */
  readonly model: string;
  /** Claude Code CLI version driving the agent (`unknown` in fake runs). */
  readonly claudeCodeVersion: string;
  /** NetScript framework version under test. */
  readonly frameworkVersion: string;
  /** Deno runtime version. */
  readonly denoVersion: string;
  /** Short hash / fingerprint of `deno.lock` for corpus pinning. */
  readonly lockfileHash: string;
  /** Deterministic seed for any stochastic step. */
  readonly seed: number;
  /** Active weight preset id. */
  readonly weightsPreset: string;
  /**
   * Whether this run used the fake driver (unit/CI) rather than a live agent.
   * A fake run is never a benchmark result — only a pipeline proof.
   */
  readonly fake: boolean;
}
