import type { SagaClockPort, SagaSleepOptions } from '../ports/mod.ts';

/** Deterministic clock for saga runtime and scheduler tests. */
export class TestSagaClock implements SagaClockPort {
  /** Stable clock identifier. */
  readonly id: string;
  #now: Date;
  readonly #sleeps: number[] = [];

  /** Create a deterministic clock at the provided time. */
  constructor(now: Date = new Date('2026-01-01T00:00:00.000Z'), id = 'test-saga-clock') {
    this.id = id;
    this.#now = new Date(now);
  }

  /** Return the current deterministic time. */
  now(): Date {
    return new Date(this.#now);
  }

  /** Record a sleep and advance deterministic time. */
  sleep(ms: number, options: SagaSleepOptions = {}): Promise<void> {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason);
    }
    this.#sleeps.push(ms);
    this.advanceBy(ms);
    return Promise.resolve();
  }

  /** Advance deterministic time by milliseconds. */
  advanceBy(ms: number): Date {
    this.#now = new Date(this.#now.getTime() + ms);
    return this.now();
  }

  /** Set deterministic time to an exact value. */
  advanceTo(next: Date): Date {
    this.#now = new Date(next);
    return this.now();
  }

  /** Return recorded sleep durations. */
  sleeps(): readonly number[] {
    return Object.freeze([...this.#sleeps]);
  }
}
