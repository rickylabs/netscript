import type { TriggerClockPort } from '../ports/mod.ts';

/** Deterministic clock for trigger runtime tests. */
export class TriggerTestClock implements TriggerClockPort {
  /** Stable test clock identifier. */
  readonly id: string;
  #now: Date;
  readonly #sleeps: number[] = [];

  /** Create a deterministic clock at the given time. */
  constructor(now: Date = new Date('2026-01-01T00:00:00.000Z'), id = 'trigger-test-clock') {
    this.id = id;
    this.#now = new Date(now);
  }

  /** Return the current test clock time. */
  now(): Date {
    return new Date(this.#now);
  }

  /** Advance by the sleep duration unless the signal is already aborted. */
  sleep(ms: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason);
    }
    this.#sleeps.push(ms);
    this.advanceBy(ms);
    return Promise.resolve();
  }

  /** Advance the clock by a millisecond duration. */
  advanceBy(ms: number): Date {
    this.#now = new Date(this.#now.getTime() + ms);
    return this.now();
  }

  /** Advance the clock to an absolute time. */
  advanceTo(next: Date): Date {
    this.#now = new Date(next);
    return this.now();
  }

  /** Return the sleep durations recorded by this clock. */
  sleeps(): readonly number[] {
    return Object.freeze([...this.#sleeps]);
  }
}
