import type { ExecutionRecord, JobDefinition, RegistryJobStoragePort } from '../registry/mod.ts';
export { MemoryJobRegistry } from '../registry/mod.ts';

/** In-memory job storage for package consumers and tests. */
export class MemoryJobStorage implements RegistryJobStoragePort {
  /** Stable storage identifier. */
  readonly id: string;
  readonly #jobs = new Map<string, JobDefinition>();
  readonly #executions = new Map<string, ExecutionRecord>();

  /** Create in-memory job storage. */
  constructor(id = 'memory-job-storage') {
    this.id = id;
  }

  /** Save a job definition. */
  saveJob(job: JobDefinition): Promise<void> {
    this.#jobs.set(job.id, job);
    return Promise.resolve();
  }

  /** Find a job definition by id. */
  findJob(jobId: string): Promise<JobDefinition | undefined> {
    return Promise.resolve(this.#jobs.get(jobId));
  }

  /** List jobs, optionally filtered by topic. */
  listJobs(topic?: string): Promise<readonly JobDefinition[]> {
    const jobs = [...this.#jobs.values()];
    return Promise.resolve(topic ? jobs.filter((job) => job.topic === topic) : jobs);
  }

  /** Save an execution record. */
  saveExecution(record: ExecutionRecord): Promise<void> {
    this.#executions.set(record.id, record);
    return Promise.resolve();
  }

  /** Find an execution record by id. */
  findExecution(executionId: string): Promise<ExecutionRecord | undefined> {
    return Promise.resolve(this.#executions.get(executionId));
  }

  /** List all execution records. */
  listExecutions(): readonly ExecutionRecord[] {
    return [...this.#executions.values()];
  }

  /** Clear all stored jobs and executions. */
  clear(): void {
    this.#jobs.clear();
    this.#executions.clear();
  }
}
