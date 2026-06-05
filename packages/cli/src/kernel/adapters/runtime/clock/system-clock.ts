/**
 * System clock adapter for CLI workflows.
 */

import type { ClockPort } from '../../../ports/clock-port.ts';

/** Clock adapter backed by the host system clock. */
export class SystemClock implements ClockPort {
  /** Current wall-clock time. */
  now(): Date {
    return new Date();
  }

  /** Monotonic timestamp in milliseconds. */
  monotonicMs(): number {
    return performance.now();
  }
}
