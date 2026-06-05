import type { ExecutionRecord, JobDefinition } from '../domain/mod.ts';
import type { JobStoragePort } from '../ports/mod.ts';
import { Registry } from './registry.ts';

/** In-memory job registry for tests and local composition. */
export class MemoryJobRegistry extends Registry<string, JobDefinition> implements JobStoragePort {
  readonly id: string;
  readonly #jobs = new Map<string, JobDefinition>();
  readonly #executions = new Map<string, ExecutionRecord>();

  constructor(id = 'memory-job-registry') {
    super();
    this.id = id;
  }

  register(key: string, value: JobDefinition): Promise<void> {
    this.#jobs.set(key, value);
    return Promise.resolve();
  }

  get(key: string): Promise<JobDefinition | undefined> {
    return Promise.resolve(this.#jobs.get(key));
  }

  entries(): Promise<readonly (readonly [string, JobDefinition])[]> {
    return Promise.resolve([...this.#jobs.entries()]);
  }

  saveJob(job: JobDefinition): Promise<void> {
    return this.register(job.id, job);
  }

  findJob(jobId: string): Promise<JobDefinition | undefined> {
    return this.get(jobId);
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
}
