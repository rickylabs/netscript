/**
 * Clock port: time seam for deterministic tests and real wall-clock timing.
 * Mirrors the cli-e2e clock shape (bench-local, no cross-import).
 *
 * @module
 */

/** Provides wall-clock and monotonic time. */
export interface Clock {
  /** Current wall-clock time. */
  now(): Date;
  /** Monotonic millisecond counter for durations. */
  monotonicMs(): number;
}
