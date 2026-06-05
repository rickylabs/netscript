import type { ExecutionRecord, JobDefinition } from '../domain/mod.ts';
import type { JobStoragePort } from '../ports/mod.ts';
export { MemoryJobRegistry } from '../registry/mod.ts';

/** In-memory job storage for package consumers and tests. */
export class MemoryJobStorage implements JobStoragePort {
  readonly id: string;
  readonly #jobs = new Map<string, JobDefinition>();
  readonly #executions = new Map<string, ExecutionRecord>();

  constructor(id = 'memory-job-storage') {
    this.id = id;
  }

  saveJob(job: JobDefinition): Promise<void> {
    this.#jobs.set(job.id, job);
    return Promise.resolve();
  }

  findJob(jobId: string): Promise<JobDefinition | undefined> {
    return Promise.resolve(this.#jobs.get(jobId));
  }

  listJobs(topic?: string): Promise<readonly JobDefinition[]> {
    const jobs = [...this.#jobs.values()];
    return Promise.resolve(topic ? jobs.filter((job) => job.topic === topic) : jobs);
  }

  saveExecution(record: ExecutionRecord): Promise<void> {
    this.#executions.set(record.id, record);
    return Promise.resolve();
  }

  findExecution(executionId: string): Promise<ExecutionRecord | undefined> {
    return Promise.resolve(this.#executions.get(executionId));
  }

  listExecutions(): readonly ExecutionRecord[] {
    return [...this.#executions.values()];
  }

  clear(): void {
    this.#jobs.clear();
    this.#executions.clear();
  }
}
