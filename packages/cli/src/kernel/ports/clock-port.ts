/**
 * Clock port shared by CLI application services.
 */

/** Time source abstraction. */
export interface ClockPort {
  /** Current wall-clock time. */
  now(): Date;

  /** Monotonic timestamp in milliseconds. */
  monotonicMs(): number;
}
