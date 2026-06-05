import type { ExecutionRecord, JobDefinition } from '../domain/mod.ts';

/** Contract for storing worker job definitions and execution records. */
export interface JobStoragePort {
  readonly id: string;
  saveJob(job: JobDefinition): Promise<void>;
  findJob(jobId: string): Promise<JobDefinition | undefined>;
  listJobs(topic?: string): Promise<readonly JobDefinition[]>;
  saveExecution(record: ExecutionRecord): Promise<void>;
  findExecution(executionId: string): Promise<ExecutionRecord | undefined>;
}
