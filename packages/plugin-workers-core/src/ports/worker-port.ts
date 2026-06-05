import type { JobContext, JobDefinition, JobResult } from '../domain/mod.ts';

/** Contract for dispatching worker jobs. */
export interface WorkerPort {
  readonly id: string;
  dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>>;
  stop(reason?: string): Promise<void>;
}
