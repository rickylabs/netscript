import type { JobDefinition, JobMessage } from '../domain/mod.ts';

/** Contract for scheduling and enqueueing worker jobs. */
export interface SchedulerPort {
  readonly id: string;
  schedule(job: JobDefinition): Promise<void>;
  enqueue(message: JobMessage): Promise<void>;
  stop(reason?: string): Promise<void>;
}
