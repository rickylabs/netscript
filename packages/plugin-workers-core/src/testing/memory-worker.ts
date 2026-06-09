import {
  createSuccessResult,
} from '../domain/mod.ts';
import type {
  JobContext,
  JobDefinition,
  JobHandler,
  JobResult,
  RuntimeWorkerPort,
} from '../runtime/mod.ts';

/** Recorded memory-worker dispatch with the job, context, and result. */
export type MemoryWorkerDispatch<TResult = unknown> = Readonly<{
  /** Dispatched job definition. */
  job: JobDefinition;
  /** Dispatch context. */
  context: JobContext;
  /** Dispatch result. */
  result: JobResult<TResult>;
}>;

/** Options for constructing an in-memory worker. */
export type MemoryWorkerOptions = Readonly<{
  /** Optional worker identifier. */
  id?: string;
  /** Static job handlers keyed by job id. */
  handlers?: ReadonlyMap<string, JobHandler>;
  /** Result returned when no handler is registered. */
  defaultResult?: JobResult;
}>;

/** In-memory worker port that records dispatches and executes registered handlers. */
export class MemoryWorker implements RuntimeWorkerPort {
  /** Stable worker identifier. */
  readonly id: string;
  readonly #handlers: ReadonlyMap<string, JobHandler>;
  readonly #defaultResult: JobResult;
  readonly #dispatches: MemoryWorkerDispatch[] = [];
  #stopped = false;
  #stopReason?: string;

  /** Create an in-memory worker. */
  constructor(options: MemoryWorkerOptions = {}) {
    this.id = options.id ?? 'memory-worker';
    this.#handlers = options.handlers ?? new Map();
    this.#defaultResult = options.defaultResult ?? createSuccessResult();
  }

  /** Recorded dispatches. */
  get dispatches(): readonly MemoryWorkerDispatch[] {
    return this.#dispatches;
  }

  /** Whether the worker has been stopped. */
  get stopped(): boolean {
    return this.#stopped;
  }

  /** Reason supplied when the worker stopped. */
  get stopReason(): string | undefined {
    return this.#stopReason;
  }

  /** Dispatch a job through registered or inline handlers. */
  async dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    if (this.#stopped) {
      throw new Error(`Worker ${this.id} is stopped.`);
    }

    const handler = (this.#handlers.get(job.id) as JobHandler<TPayload, TResult> | undefined) ??
      job.handler;
    const result = handler ? await handler(context) : (this.#defaultResult as JobResult<TResult>);
    this.#dispatches.push(Object.freeze({ job, context, result }) as MemoryWorkerDispatch);
    return result as JobResult<TResult>;
  }

  /** Stop the worker. */
  stop(reason?: string): Promise<void> {
    this.#stopped = true;
    this.#stopReason = reason;
    return Promise.resolve();
  }
}
