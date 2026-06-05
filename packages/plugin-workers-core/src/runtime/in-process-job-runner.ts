import type { JobContext, JobDefinition, JobResult } from '../domain/mod.ts';
import type { WorkerPort } from '../ports/mod.ts';
import { InProcessJobDispatcher, type JobDispatcherOptions } from './job-dispatcher.ts';

/** Options for creating an in-process job runner. */
export type InProcessJobRunnerOptions =
  & JobDispatcherOptions
  & Readonly<{
    id?: string;
  }>;

/** Registry-first job runner for tests, compiled binaries, and local composition. */
export class InProcessJobRunner implements WorkerPort {
  readonly id: string;
  readonly #dispatcher: InProcessJobDispatcher;
  #stopped = false;

  constructor(options: InProcessJobRunnerOptions = {}) {
    this.id = options.id ?? 'in-process-job-runner';
    this.#dispatcher = new InProcessJobDispatcher(options);
  }

  dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    if (this.#stopped) {
      throw new Error(`Runner ${this.id} has stopped.`);
    }

    return this.#dispatcher.dispatch(job, context);
  }

  stop(_reason?: string): Promise<void> {
    this.#stopped = true;
    return Promise.resolve();
  }
}
