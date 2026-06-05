import type { Clock } from '../../ports/clock.ts';

/** System clock adapter. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  monotonicMs(): number {
    return performance.now();
  }
}
