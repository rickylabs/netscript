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

export type MemoryWorkerDispatch<TResult = unknown> = Readonly<{
  job: JobDefinition;
  context: JobContext;
  result: JobResult<TResult>;
}>;

export type MemoryWorkerOptions = Readonly<{
  id?: string;
  handlers?: ReadonlyMap<string, JobHandler>;
  defaultResult?: JobResult;
}>;

/** In-memory worker port that records dispatches and executes registered handlers. */
export class MemoryWorker implements RuntimeWorkerPort {
  readonly id: string;
  readonly #handlers: ReadonlyMap<string, JobHandler>;
  readonly #defaultResult: JobResult;
  readonly #dispatches: MemoryWorkerDispatch[] = [];
  #stopped = false;
  #stopReason?: string;

  constructor(options: MemoryWorkerOptions = {}) {
    this.id = options.id ?? 'memory-worker';
    this.#handlers = options.handlers ?? new Map();
    this.#defaultResult = options.defaultResult ?? createSuccessResult();
  }

  get dispatches(): readonly MemoryWorkerDispatch[] {
    return this.#dispatches;
  }

  get stopped(): boolean {
    return this.#stopped;
  }

  get stopReason(): string | undefined {
    return this.#stopReason;
  }

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

  stop(reason?: string): Promise<void> {
    this.#stopped = true;
    this.#stopReason = reason;
    return Promise.resolve();
  }
}
