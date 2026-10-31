import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import { delay } from '@std/async';

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

export type WorkerListenerStatus = 'idle' | 'running' | 'restarting' | 'failed' | 'stopped';

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

  async stop(): Promise<void> {
    if (this.#status === 'stopped') {
      return;
    }
    this.#status = 'stopped';
    if (!['failed', 'crash-looping'].includes(this.#health.snapshot().state)) {
      this.#health.stopped();
    }
    this.#localAbort.abort();
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
    const signal = combineSignals(this.#localAbort.signal, this.#abortSignal);
    try {
      while (!signal.aborted) {
        this.#status = 'running';
        this.#runningSince = this.#now();
        this.#health.dependenciesReady();
        this.#health.running();
        try {
          await this.#run(signal);
          if (signal.aborted) {
            break;
          }
          throw new Error(`Listener '${this.name}' exited unexpectedly.`);
        } catch (error) {
          if (signal.aborted || isAbortError(error)) {
            break;
          }

          this.#resetHealthyBudget();
          this.#runningSince = undefined;
          this.#recordError(error);

          if (this.#restartBudgetUsed >= this.#maxRestarts) {
            this.#status = 'failed';
            this.#health.failed();
            this.#onFailure?.(error, this.snapshot());
            return;
          }

          this.#restartCount = Math.min(Number.MAX_SAFE_INTEGER, this.#restartCount + 1);
          this.#restartBudgetUsed = Math.min(Number.MAX_SAFE_INTEGER, this.#restartBudgetUsed + 1);
          this.#health.restarting();
          this.#status = 'restarting';
          this.#onFailure?.(error, this.snapshot());
          try {
            await this.#sleep(this.#nextBackoffMs(), signal);
          } catch (sleepError) {
            if (signal.aborted || isAbortError(sleepError)) break;
            this.#recordError(sleepError);
            this.#status = 'failed';
            this.#health.failed();
            this.#onFailure?.(sleepError, this.snapshot());
            return;
          }
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

function combineSignals(first: AbortSignal, second?: AbortSignal): AbortSignal {
  if (!second) {
    return first;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (first.aborted || second.aborted) {
    controller.abort();
    return controller.signal;
  }

  first.addEventListener('abort', abort, { once: true });
  second.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

/** Map backend errors to fixed categories; exception text never enters public health. */
function classifyFailure(error: unknown): WorkerListenerFailureCause {
  let current = error;
  for (let depth = 0; depth < 8 && current instanceof Error; depth++) {
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
