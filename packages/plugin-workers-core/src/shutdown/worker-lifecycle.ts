/** Worker lifecycle and shutdown budget contracts. @module */

/** Lifecycle of one worker instance; stopped instances are terminal. */
export type WorkerLifecycleState = 'idle' | 'running' | 'paused' | 'draining' | 'stopped';

/** Monotonic time and disposable scheduling for worker drain deadlines. */
export interface WorkerDrainClock {
  /** Nondecreasing elapsed time in milliseconds. */
  now(): number;
  /** Schedule a callback; the returned function cancels the timer. */
  schedule(delayMs: number, callback: () => void): () => void;
}

/** Configuration of the whole worker stop, including abort cleanup and settlement. */
export interface WorkerDrainOptions {
  /** Total stop budget; defaults to 25,000 ms, leaving headroom in a 30-second parent. */
  readonly drainTimeoutMs?: number;
  /**
   * Handler cleanup after abort, within the total budget. Defaults to min(5,000,
   * floor(drainTimeoutMs / 5)); the default total reserves 19 s work + 5 s abort
   * cleanup + 1 s settlement, inside the queue's 30-second listener drain.
   */
  readonly abortGracePeriodMs?: number;
  /** Direct-composition clock; configuration files contain durations only. */
  readonly drainClock?: WorkerDrainClock;
}

/** Resolved durations within one total worker stop deadline. */
export interface WorkerDrainBudget {
  /** Whole stop, including settlement. */
  readonly totalMs: number;
  /** Time available before aborting admitted work. */
  readonly workMs: number;
  /** Requested handler cleanup; actual waiting is capped by the remaining total. */
  readonly abortGracePeriodMs: number;
  /** Reserved time to settle listeners and close owned queues. */
  readonly settlementMs: number;
}

/** Default total stop budget, below the process and queue drain budgets. */
export const DEFAULT_WORKER_DRAIN_TIMEOUT_MS: number = 25_000;

/** One fifth of the default total, allowing cleanup longer than one second. */
export const DEFAULT_ABORT_GRACE_PERIOD_MS: number = DEFAULT_WORKER_DRAIN_TIMEOUT_MS / 5;

/** Validate and resolve worker durations before allocating runtime resources. */
export function resolveWorkerDrainBudget(options: WorkerDrainOptions = {}): WorkerDrainBudget {
  const totalMs = options.drainTimeoutMs ?? DEFAULT_WORKER_DRAIN_TIMEOUT_MS;
  const abortGracePeriodMs = options.abortGracePeriodMs ??
    Math.min(DEFAULT_ABORT_GRACE_PERIOD_MS, Math.floor(totalMs / 5));
  for (
    const [name, value, minimum, maximum] of [
      ['drainTimeoutMs', totalMs, 1, 2_147_483_647],
      ['abortGracePeriodMs', abortGracePeriodMs, 0, totalMs],
    ] as const
  ) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new RangeError(`${name} must be an integer between ${minimum} and ${maximum}.`);
    }
  }
  const settlementMs = Math.min(1_000, Math.max(1, Math.floor(totalMs / 25)));
  return {
    totalMs,
    abortGracePeriodMs,
    settlementMs,
    workMs: Math.max(0, totalMs - abortGracePeriodMs - settlementMs),
  };
}
