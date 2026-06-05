import type { JobDefinition, JobResult } from '../domain/mod.ts';
import type { ExecutionContext } from './task-executor.ts';

/** Stub-only contract for job dispatchers. */
export abstract class JobDispatcher {
  abstract readonly id: string;
  abstract dispatch(job: JobDefinition, ctx: ExecutionContext): Promise<JobResult>;
}
