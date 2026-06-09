import type { ExecutionRecord, JobDefinition, RegistryJobStoragePort } from './registry-types.ts';
import { Registry } from './registry.ts';

/** In-memory job registry for tests and local composition. */
export class MemoryJobRegistry extends Registry<string, JobDefinition>
  implements RegistryJobStoragePort {
  /** Stable registry identifier. */
  readonly id: string;
  readonly #jobs = new Map<string, JobDefinition>();
  readonly #executions = new Map<string, ExecutionRecord>();

  /** Create an in-memory job registry. */
  constructor(id = 'memory-job-registry') {
    super();
    this.id = id;
  }

  /** Register or replace a job definition by key. */
  register(key: string, value: JobDefinition): Promise<void> {
    this.#jobs.set(key, value);
    return Promise.resolve();
  }

  /** Get a job definition by key. */
  get(key: string): Promise<JobDefinition | undefined> {
    return Promise.resolve(this.#jobs.get(key));
  }

  /** List raw registry entries. */
  entries(): Promise<readonly (readonly [string, JobDefinition])[]> {
    return Promise.resolve([...this.#jobs.entries()]);
  }

  /** Save a job definition. */
  saveJob(job: JobDefinition): Promise<void> {
    return this.register(job.id, job);
  }

  /** Find a job definition by id. */
  findJob(jobId: string): Promise<JobDefinition | undefined> {
    return this.get(jobId);
  }

  /** List jobs, optionally filtered by topic. */
  listJobs(topic?: string): Promise<readonly JobDefinition[]> {
    const jobs = [...this.#jobs.values()];
    return Promise.resolve(topic ? jobs.filter((job) => job.topic === topic) : jobs);
  }

  /** Save a job execution record. */
  saveExecution(record: ExecutionRecord): Promise<void> {
    this.#executions.set(record.id, record);
    return Promise.resolve();
  }

  /** Find a job execution record by id. */
  findExecution(executionId: string): Promise<ExecutionRecord | undefined> {
    return Promise.resolve(this.#executions.get(executionId));
  }
}
