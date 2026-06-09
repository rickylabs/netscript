import type { JobDefinition, JobResult } from '../runtime/runtime-types.ts';
import type { ExecutionContext } from './task-executor.ts';

/** Stub-only contract for job dispatchers. */
export abstract class JobDispatcher {
  /** Stable dispatcher identifier. */
  abstract readonly id: string;
  /** Dispatch a job with execution context. */
  abstract dispatch(job: JobDefinition, ctx: ExecutionContext): Promise<JobResult>;
}
