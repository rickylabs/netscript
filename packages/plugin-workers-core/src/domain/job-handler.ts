import type { JobContext } from './job-context.ts';
import type { JobResult } from './job-result.ts';

/** Function that executes a worker job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobContext<TPayload, TResult>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

/** Job handler definition accepted by `defineJobHandler`. */
export type JobHandlerSpec<TPayload = unknown, TResult = unknown> = Readonly<{
  name: string;
  execute: JobHandler<TPayload, TResult>;
}>;
