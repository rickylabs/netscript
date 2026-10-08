import type { JobRunnerClock } from '../ports/job-runner-clock.ts';

/** Web Platform clock and timer adapter for job deadlines and cleanup grace. */
export class WebPlatformJobRunnerClock implements JobRunnerClock {
  readonly #now: () => number;

  /** Create a clock, optionally adapting an existing epoch-time source. */
  constructor(now: () => number = Date.now) {
    this.#now = now;
  }

  /** Current time in epoch milliseconds. */
  now(): number {
    return this.#now();
  }

  /** Schedule one callback with a disposable timer. */
  schedule(delayMs: number, callback: () => void): () => void {
    let remaining = delayMs;
    let timer: ReturnType<typeof setTimeout>;
    const arm = (): void => {
      const step = Math.min(remaining, 2_147_483_647);
      timer = setTimeout(() => {
        remaining -= step;
        if (remaining > 0) arm();
        else callback();
      }, step);
    };
    arm();
    return () => clearTimeout(timer);
  }
}
