import { WebPlatformJobRunnerClock } from '../adapters/web-platform-job-runner-clock.ts';
import type { JobRunnerClock } from '../ports/job-runner-clock.ts';
import { InProcessJobDispatcher, type JobDispatcherOptions } from './job-dispatcher.ts';
import type {
  JobDefinition,
  JobDispatchContext,
  JobResult,
  RuntimeWorkerPort,
} from './runtime-types.ts';

/** Options for creating an in-process job runner. */
export type InProcessJobRunnerOptions =
  & JobDispatcherOptions
  & Readonly<{
    id?: string;
    /** Injectable time and disposable scheduling. */
    clock?: JobRunnerClock;
    /** Cleanup wait after abort; bounds waiting, not physical JavaScript termination. */
    abortGracePeriodMs?: number;
  }>;

/** Registry-first job runner for tests, compiled binaries, and local composition. */
export class InProcessJobRunner implements RuntimeWorkerPort {
  /** Stable runner identifier. */
  readonly id: string;
  readonly #dispatcher: InProcessJobDispatcher;
  readonly #clock: JobRunnerClock;
  readonly #graceMs: number;
  readonly #active = new Set<
    Readonly<{
      controller: AbortController;
      completion: Promise<unknown>;
    }>
  >();
  #stopped = false;

  /** Create an in-process runner from handler resolution options. */
  constructor(options: InProcessJobRunnerOptions = {}) {
    this.id = options.id ?? 'in-process-job-runner';
    this.#dispatcher = new InProcessJobDispatcher(options);
    this.#clock = options.clock ?? new WebPlatformJobRunnerClock();
    this.#graceMs = options.abortGracePeriodMs ?? 1_000;
    validateDuration(this.#graceMs, 'abortGracePeriodMs');
  }

  /** Dispatch with an owned signal and the earliest configured deadline. */
  async dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    input: JobDispatchContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    if (this.#stopped) {
      throw new Error(`Runner ${this.id} has stopped.`);
    }

    if (job.timeout !== undefined) validateDuration(job.timeout, 'job.timeout');
    if (input.deadlineAt !== undefined && !Number.isFinite(input.deadlineAt)) {
      throw new RangeError('deadlineAt must be finite epoch milliseconds.');
    }
    const timeoutDeadline = job.timeout === undefined ? undefined : this.#clock.now() + job.timeout;
    const deadlineAt = input.deadlineAt === undefined
      ? timeoutDeadline
      : timeoutDeadline === undefined
      ? input.deadlineAt
      : Math.min(input.deadlineAt, timeoutDeadline);
    if (deadlineAt !== undefined && !Number.isFinite(deadlineAt)) {
      throw new RangeError('Effective deadline must be finite epoch milliseconds.');
    }
    const controller = new AbortController();
    // Record ownership before entering the dispatcher, including synchronous stop races.
    const completion = Promise.resolve().then(() =>
      this.execute(job, input, controller, deadlineAt)
    );
    const active = { controller, completion };
    this.#active.add(active);
    try {
      return await completion;
    } finally {
      this.#active.delete(active);
    }
  }

  /** Reject admission, abort with ShutdownError and await the bounded active drain. */
  async stop(_reason?: string): Promise<void> {
    this.#stopped = true;
    const active = [...this.#active];
    for (const execution of active) {
      execution.controller.abort(new DOMException('Worker shutdown began.', 'ShutdownError'));
    }
    await Promise.allSettled(active.map((execution) => execution.completion));
  }

  /** Own deadline, parent linkage and bounded abort cleanup for one dispatch. */
  private async execute<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    input: JobDispatchContext<TPayload, TResult>,
    controller: AbortController,
    deadlineAt: number | undefined,
  ): Promise<JobResult<TResult>> {
    const signal = controller.signal;
    const onParentAbort = (): void => controller.abort(cancellationReason(input.signal?.reason));
    if (input.signal?.aborted) onParentAbort();
    signal.throwIfAborted();
    if (deadlineAt !== undefined && deadlineAt <= this.#clock.now()) {
      controller.abort(new DOMException('Job deadline elapsed.', 'TimeoutError'));
      signal.throwIfAborted();
    }

    let disposeDeadline: (() => void) | undefined;
    let disposeGrace: (() => void) | undefined;
    const aborted = Promise.withResolvers<never>();
    const onAbort = (): void => {
      disposeDeadline?.();
      disposeDeadline = undefined;
      disposeGrace = this.#clock.schedule(this.#graceMs, () => aborted.reject(signal.reason));
    };
    const armDeadline = (): void => {
      if (deadlineAt === undefined || signal.aborted) return;
      const remaining = deadlineAt - this.#clock.now();
      if (remaining <= 0) {
        controller.abort(new DOMException('Job deadline elapsed.', 'TimeoutError'));
      } else {
        // Web timers clamp large delays; recheck elapsed time instead of aborting early.
        disposeDeadline = this.#clock.schedule(Math.min(remaining, 2_147_483_647), armDeadline);
      }
    };
    signal.addEventListener('abort', onAbort, { once: true });
    input.signal?.addEventListener('abort', onParentAbort, { once: true });
    armDeadline();
    try {
      const handler = this.#dispatcher.dispatch(job, {
        ...input,
        signal,
        deadlineAt,
        reportProgress: input.reportProgress === undefined ? undefined : (percent, message) => {
          signal.throwIfAborted();
          return input.reportProgress!(percent, message);
        },
      }).then(
        (result) => {
          signal.throwIfAborted();
          return result;
        },
        (error: unknown) => {
          signal.throwIfAborted();
          throw error;
        },
      );
      return await Promise.race([handler, aborted.promise]);
    } finally {
      disposeDeadline?.();
      disposeGrace?.();
      signal.removeEventListener('abort', onAbort);
      input.signal?.removeEventListener('abort', onParentAbort);
    }
  }
}

function cancellationReason(reason: unknown): Error {
  if (
    reason instanceof Error &&
    ['TimeoutError', 'ShutdownError', 'AbortError'].includes(reason.name)
  ) return reason;
  return new DOMException('Job cancellation requested.', 'AbortError');
}

function validateDuration(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and nonnegative.`);
  }
}
