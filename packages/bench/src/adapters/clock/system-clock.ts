/**
 * System clock adapter: real wall-clock and monotonic time.
 *
 * @module
 */

import type { Clock } from '../../ports/clock.ts';

/** Wall-clock via `Date`, monotonic via `performance.now()`. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  monotonicMs(): number {
    return performance.now();
  }
}
