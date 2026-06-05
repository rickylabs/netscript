import type { TriggerClockPort } from '../ports/mod.ts';

/** Deterministic clock for trigger runtime tests. */
export class TriggerTestClock implements TriggerClockPort {
  readonly id: string;
  #now: Date;
  readonly #sleeps: number[] = [];

  constructor(now: Date = new Date('2026-01-01T00:00:00.000Z'), id = 'trigger-test-clock') {
    this.id = id;
    this.#now = new Date(now);
  }

  now(): Date {
    return new Date(this.#now);
  }

  sleep(ms: number, options: Readonly<{ signal?: AbortSignal }> = {}): Promise<void> {
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason);
    }
    this.#sleeps.push(ms);
    this.advanceBy(ms);
    return Promise.resolve();
  }

  advanceBy(ms: number): Date {
    this.#now = new Date(this.#now.getTime() + ms);
    return this.now();
  }

  advanceTo(next: Date): Date {
    this.#now = new Date(next);
    return this.now();
  }

  sleeps(): readonly number[] {
    return Object.freeze([...this.#sleeps]);
  }
}
