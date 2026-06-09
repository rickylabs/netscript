import { InProcessJobDispatcher, type JobDispatcherOptions } from './job-dispatcher.ts';
import type { JobContext, JobDefinition, JobResult, RuntimeWorkerPort } from './runtime-types.ts';

/** Options for creating an in-process job runner. */
export type InProcessJobRunnerOptions =
  & JobDispatcherOptions
  & Readonly<{
    id?: string;
  }>;

/** Registry-first job runner for tests, compiled binaries, and local composition. */
export class InProcessJobRunner implements RuntimeWorkerPort {
  /** Stable runner identifier. */
  readonly id: string;
  readonly #dispatcher: InProcessJobDispatcher;
  #stopped = false;

  /** Create an in-process runner from handler resolution options. */
  constructor(options: InProcessJobRunnerOptions = {}) {
    this.id = options.id ?? 'in-process-job-runner';
    this.#dispatcher = new InProcessJobDispatcher(options);
  }

  /** Dispatch a job through the in-process dispatcher. */
  dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    if (this.#stopped) {
      throw new Error(`Runner ${this.id} has stopped.`);
    }

    return this.#dispatcher.dispatch(job, context);
  }

  /** Stop accepting new in-process dispatches. */
  stop(_reason?: string): Promise<void> {
    this.#stopped = true;
    return Promise.resolve();
  }
}
