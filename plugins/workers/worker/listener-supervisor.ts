import { delay } from '@std/async';

export type WorkerListenerStatus = 'idle' | 'running' | 'restarting' | 'failed' | 'stopped';

export interface WorkerListenerSnapshot {
  readonly name: string;
  readonly status: WorkerListenerStatus;
  readonly healthy: boolean;
  readonly restartCount: number;
  readonly lastError?: string;
}

export interface WorkerListenerSupervisorOptions {
  readonly name: string;
  readonly run: (signal: AbortSignal) => Promise<void>;
  readonly abortSignal?: AbortSignal;
  readonly maxRestarts?: number;
  readonly initialBackoffMs?: number;
  readonly maxBackoffMs?: number;
  readonly sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly onFailure?: (error: unknown, snapshot: WorkerListenerSnapshot) => void;
}

/** Supervises one long-running queue listener and marks it failed after bounded restarts. */
export class WorkerListenerSupervisor {
  readonly name: string;
  readonly completion: Promise<void>;

  #status: WorkerListenerStatus = 'idle';
  #restartCount = 0;
  #lastError: string | undefined;
  #completionResolve!: () => void;
  #started = false;
  #localAbort = new AbortController();

  readonly #run: (signal: AbortSignal) => Promise<void>;
  readonly #abortSignal?: AbortSignal;
  readonly #maxRestarts: number;
  readonly #initialBackoffMs: number;
  readonly #maxBackoffMs: number;
  readonly #sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly #onFailure?: (error: unknown, snapshot: WorkerListenerSnapshot) => void;

  constructor(options: WorkerListenerSupervisorOptions) {
    this.name = options.name;
    this.#run = options.run;
    this.#abortSignal = options.abortSignal;
    this.#maxRestarts = options.maxRestarts ?? 3;
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
    this.#localAbort.abort();
    await this.completion;
  }

  snapshot(): WorkerListenerSnapshot {
    return {
      name: this.name,
      status: this.#status,
      healthy: this.#status !== 'failed',
      restartCount: this.#restartCount,
      lastError: this.#lastError,
    };
  }

  async #runLoop(): Promise<void> {
    const signal = combineSignals(this.#localAbort.signal, this.#abortSignal);
    try {
      while (!signal.aborted) {
        this.#status = 'running';
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

          this.#lastError = error instanceof Error ? error.message : String(error);

          if (this.#restartCount >= this.#maxRestarts) {
            this.#status = 'failed';
            this.#onFailure?.(error, this.snapshot());
            return;
          }

          this.#restartCount += 1;
          this.#status = 'restarting';
          this.#onFailure?.(error, this.snapshot());
          await this.#sleep(this.#nextBackoffMs(), signal);
        }
      }
      this.#status = 'stopped';
    } finally {
      this.#completionResolve();
    }
  }

  #nextBackoffMs(): number {
    return Math.min(
      this.#initialBackoffMs * 2 ** Math.max(0, this.#restartCount - 1),
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
