import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import { QueueError, QueueErrorCode } from '@netscript/queue';
import { abortable, delay } from '@std/async';

/** Credential-safe category for a listener's most recent failure. */
export type WorkerListenerFailureCause =
  | 'store-write-refused'
  | 'connection-unavailable'
  | 'listener-error';

const FAILURE_MESSAGES: Readonly<Record<WorkerListenerFailureCause, string>> = Object.freeze({
  'store-write-refused': 'Queue store refused a write (details redacted).',
  'connection-unavailable': 'Queue store connection unavailable (details redacted).',
  'listener-error': 'Queue listener failed (details redacted).',
});
const DEFAULT_HEALTHY_RESET_MS = 60_000;

/** Resolve the healthy interval before a worker allocates runtime resources. */
export function resolveListenerHealthyResetMs(value?: number): number {
  const resolved = value ?? DEFAULT_HEALTHY_RESET_MS;
  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new RangeError('listenerHealthyResetMs must be a finite positive number.');
  }
  return resolved;
}

export type WorkerListenerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'restarting'
  | 'failed'
  | 'stopped';

export interface WorkerListenerSnapshot {
  readonly name: string;
  readonly status: WorkerListenerStatus;
  readonly healthy: boolean;
  /** Cumulative restart attempts for this listener instance. */
  readonly restartCount: number;
  /** Restart attempts charged since the last healthy running interval. */
  readonly restartBudgetUsed: number;
  /** Redacted category of the most recent listener failure, retained after recovery. */
  readonly failureCause?: WorkerListenerFailureCause;
  readonly lastError?: string;
  readonly childHealth: ChildHealthSnapshot;
}

export interface WorkerListenerSupervisorOptions {
  readonly name: string;
  readonly run: (signal: AbortSignal) => Promise<void>;
  readonly abortSignal?: AbortSignal;
  readonly maxRestarts?: number;
  readonly healthyResetMs?: number;
  readonly initialBackoffMs?: number;
  readonly maxBackoffMs?: number;
  readonly sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly now?: () => number;
  readonly onFailure?: (error: unknown, snapshot: WorkerListenerSnapshot) => void;
}

/** Supervises one long-running queue listener and marks it failed after bounded restarts. */
export class WorkerListenerSupervisor {
  readonly name: string;
  readonly completion: Promise<void>;

  #status: WorkerListenerStatus = 'idle';
  #restartCount = 0;
  #restartBudgetUsed = 0;
  #runningSince: number | undefined;
  #failureCause: WorkerListenerFailureCause | undefined;
  #lastError: string | undefined;
  readonly #health: ChildHealthMonitor;
  #completionResolve!: () => void;
  #started = false;
  #paused = false;
  #resumed = Promise.withResolvers<void>();
  #generation?: {
    controller: AbortController;
    done: ReturnType<typeof Promise.withResolvers<void>>;
  };
  #localAbort = new AbortController();

  readonly #run: (signal: AbortSignal) => Promise<void>;
  readonly #abortSignal?: AbortSignal;
  readonly #maxRestarts: number;
  readonly #healthyResetMs: number;
  readonly #now: () => number;
  readonly #initialBackoffMs: number;
  readonly #maxBackoffMs: number;
  readonly #sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly #onFailure?: (error: unknown, snapshot: WorkerListenerSnapshot) => void;

  constructor(options: WorkerListenerSupervisorOptions) {
    this.name = options.name;
    this.#health = new ChildHealthMonitor(options.now);
    this.#health.registryLoaded();
    this.#run = options.run;
    this.#abortSignal = options.abortSignal;
    this.#maxRestarts = options.maxRestarts ?? 3;
    this.#healthyResetMs = resolveListenerHealthyResetMs(options.healthyResetMs);
    this.#now = options.now ?? (() => performance.now());
    this.#initialBackoffMs = options.initialBackoffMs ?? 100;
    this.#maxBackoffMs = options.maxBackoffMs ?? 5_000;
    this.#sleep = options.sleep ?? defaultSleep;
    this.#onFailure = options.onFailure;
    this.completion = new Promise((resolve) => {
      this.#completionResolve = resolve;
    });
  }

  start(): void {
    if (this.#started) {
      return;
    }
    this.#started = true;
    void this.#runLoop();
  }

  /** Stop intake without ending the supervisor lifetime or cancelling admitted work. */
  pause(): Promise<void> {
    if (!this.#started || this.#localAbort.signal.aborted || this.#status === 'failed') {
      return Promise.resolve();
    }
    this.#resetHealthyBudget();
    if (!this.#paused) this.#resumed = Promise.withResolvers<void>();
    this.#paused = true;
    this.#status = 'paused';
    this.#runningSince = undefined;
    this.#generation?.controller.abort();
    return this.#generation?.done.promise ?? Promise.resolve();
  }

  /** Resume after the previous listener's admitted callbacks have settled. */
  resume(): void {
    if (this.#localAbort.signal.aborted || this.#status === 'failed') return;
    this.#paused = false;
    this.#resumed.resolve();
  }

  async stop(): Promise<void> {
    if (!this.#started) {
      this.#started = true;
      this.#completionResolve();
    }
    this.#status = 'stopped';
    if (!['failed', 'crash-looping'].includes(this.#health.snapshot().state)) {
      this.#health.stopped();
    }
    this.#localAbort.abort();
    this.#resumed.resolve();
    await this.completion;
  }

  snapshot(): WorkerListenerSnapshot {
    this.#resetHealthyBudget();
    const health = this.#health.snapshot();
    const childHealth: ChildHealthSnapshot = health.lastFatalError && this.#failureCause
      ? Object.freeze({
        ...health,
        lastFatalError: Object.freeze({
          ...health.lastFatalError,
          message: FAILURE_MESSAGES[this.#failureCause],
        }),
      })
      : health;
    return {
      name: this.name,
      status: this.#status,
      healthy: childHealth.state === 'ready',
      childHealth,
      restartCount: this.#restartCount,
      restartBudgetUsed: this.#restartBudgetUsed,
      failureCause: this.#failureCause,
      lastError: this.#lastError,
    };
  }

  async #runLoop(): Promise<void> {
    const signal = this.#abortSignal
      ? AbortSignal.any([this.#localAbort.signal, this.#abortSignal])
      : this.#localAbort.signal;
    try {
      while (!signal.aborted) {
        if (this.#paused) {
          try {
            await abortable(this.#resumed.promise, signal);
          } catch {
            if (signal.aborted) break;
          }
          if (signal.aborted) break;
          if (this.#paused) continue;
        }
        const generation = {
          controller: new AbortController(),
          done: Promise.withResolvers<void>(),
        };
        void generation.done.promise.catch(() => {});
        this.#generation = generation;
        const attempt = AbortSignal.any([signal, generation.controller.signal]);
        this.#status = 'running';
        this.#runningSince = this.#now();
        this.#health.dependenciesReady();
        this.#health.running();
        let failure: { error: unknown } | undefined;
        try {
          await this.#run(attempt);
          if (!attempt.aborted) throw new Error(`Listener '${this.name}' exited unexpectedly.`);
        } catch (error) {
          if (!(attempt.aborted && (isAbortError(error) || error === attempt.reason))) {
            failure = { error };
          }
        } finally {
          if (failure) generation.done.reject(failure.error);
          else generation.done.resolve();
          if (this.#generation === generation) this.#generation = undefined;
        }
        if (!failure) continue;
        this.#resetHealthyBudget();
        this.#runningSince = undefined;
        this.#recordError(failure.error);
        if (signal.aborted || this.#restartBudgetUsed >= this.#maxRestarts) {
          this.#status = 'failed';
          this.#health.failed();
          this.#onFailure?.(failure.error, this.snapshot());
          return;
        }
        this.#restartCount = Math.min(Number.MAX_SAFE_INTEGER, this.#restartCount + 1);
        this.#restartBudgetUsed = Math.min(Number.MAX_SAFE_INTEGER, this.#restartBudgetUsed + 1);
        this.#health.restarting();
        this.#status = this.#paused ? 'paused' : 'restarting';
        this.#onFailure?.(failure.error, this.snapshot());
        if (this.#paused) continue;
        try {
          await this.#sleep(this.#nextBackoffMs(), signal);
        } catch (error) {
          if (signal.aborted || isAbortError(error)) break;
          this.#recordError(error);
          this.#status = 'failed';
          this.#health.failed();
          this.#onFailure?.(error, this.snapshot());
          return;
        }
      }
      this.#status = 'stopped';
      this.#health.stopped();
    } finally {
      this.#completionResolve();
    }
  }

  #resetHealthyBudget(): void {
    if (
      this.#status === 'running' && this.#runningSince !== undefined &&
      this.#now() - this.#runningSince >= this.#healthyResetMs
    ) {
      this.#restartBudgetUsed = 0;
    }
  }

  #recordError(error: unknown): void {
    this.#lastError = error instanceof Error ? error.message : String(error);
    this.#failureCause = classifyFailure(error);
  }

  #nextBackoffMs(): number {
    return Math.min(
      this.#initialBackoffMs * 2 ** Math.min(1023, Math.max(0, this.#restartBudgetUsed - 1)),
      this.#maxBackoffMs,
    );
  }
}

function defaultSleep(ms: number, signal: AbortSignal): Promise<void> {
  return delay(ms, { signal });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Map backend errors to fixed categories; exception text never enters public health. */
function classifyFailure(error: unknown): WorkerListenerFailureCause {
  let current = error;
  for (let depth = 0; depth < 8 && current instanceof Error; depth++) {
    if (current instanceof QueueError && current.code === QueueErrorCode.CONNECTION_FAILED) {
      return 'connection-unavailable';
    }
    if (/\b(?:OOM|READONLY|NOPERM|MISCONF)\b/i.test(current.message)) {
      return 'store-write-refused';
    }
    if (
      /ECONNREFUSED|ECONNRESET|ETIMEDOUT|connection.*(?:closed|unavailable)/i.test(current.message)
    ) {
      return 'connection-unavailable';
    }
    current = current.cause;
  }
  return 'listener-error';
}
