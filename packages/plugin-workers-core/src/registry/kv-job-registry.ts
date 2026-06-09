import { DEFAULT_TOPIC, JobDefinitionSchema } from '../domain/mod.ts';
import type {
  ExecutionRecord,
  JobDefinition,
  JobSource,
  RegisterJobInput,
  RegistryJobStoragePort,
} from './registry-types.ts';
import type { RegistryKvStore, RegistryOptions } from './registry-options.ts';
import { Registry } from './registry.ts';

const JOB_PREFIX = ['workers', 'jobs'] as const;
const EXECUTION_PREFIX = ['workers', 'executions'] as const;

/** Filters accepted when listing worker jobs. */
export type JobFilterOptions = Readonly<{
  enabled?: boolean;
  limit?: number;
  pluginId?: string;
  scheduled?: boolean;
  source?: JobSource;
  tags?: readonly string[];
  topic?: string;
}>;

/** KV-backed job registry for runtime composition. */
export class KvJobRegistry extends Registry<string, JobDefinition>
  implements RegistryJobStoragePort {
  /** Stable registry identifier. */
  readonly id: string;
  readonly #topic?: string;
  readonly #kv: RegistryKvStore;

  /** Create a KV-backed job registry. */
  constructor(options: RegistryOptions & { kv: RegistryKvStore }) {
    super();
    this.id = options.id ?? 'kv-job-registry';
    this.#topic = options.topic;
    this.#kv = options.kv;
  }

  /** Register or replace a job definition by key. */
  async register(key: string, value: JobDefinition): Promise<void> {
    await this.#kv.set([...JOB_PREFIX, key], value);
  }

  /** Normalize and register a new job definition. */
  async registerJob(input: RegisterJobInput): Promise<JobDefinition> {
    const job = normalizeJobDefinition(input);
    const existing = await this.get(job.id);
    if (existing) {
      throw new Error(`Job with id '${job.id}' already exists`);
    }
    await this.register(job.id, job);
    return job;
  }

  /** Get a job definition by key. */
  async get(key: string): Promise<JobDefinition | undefined> {
    const entry = await this.#kv.get<JobDefinition>([...JOB_PREFIX, key]);
    return entry?.value ?? undefined;
  }

  /** List raw registry entries. */
  async entries(): Promise<readonly (readonly [string, JobDefinition])[]> {
    const result: (readonly [string, JobDefinition])[] = [];
    for await (const entry of this.#kv.list<JobDefinition>({ prefix: JOB_PREFIX })) {
      if (entry.value) result.push([String(entry.key.at(-1)), entry.value] as const);
    }
    return result;
  }

  /** Save a job definition. */
  async saveJob(job: JobDefinition): Promise<void> {
    await this.register(job.id, job);
  }

  /** Find a job definition by id. */
  findJob(jobId: string): Promise<JobDefinition | undefined> {
    return this.get(jobId);
  }

  /** List jobs, optionally filtered by topic or filter options. */
  async listJobs(
    optionsOrTopic: JobFilterOptions | string | undefined = this.#topic,
  ): Promise<readonly JobDefinition[]> {
    const options = typeof optionsOrTopic === 'string' || optionsOrTopic === undefined
      ? { topic: optionsOrTopic }
      : optionsOrTopic;
    const entries = await this.entries();
    let jobs = entries.map((entry) => entry[1]);
    if (options.topic) jobs = jobs.filter((job) => (job.topic ?? DEFAULT_TOPIC) === options.topic);
    if (options.enabled !== undefined) jobs = jobs.filter((job) => job.enabled === options.enabled);
    if (options.scheduled !== undefined) {
      jobs = jobs.filter((job) => options.scheduled ? job.schedule !== undefined : !job.schedule);
    }
    if (options.source) jobs = jobs.filter((job) => job.source === options.source);
    if (options.pluginId) jobs = jobs.filter((job) => job.pluginId === options.pluginId);
    if (options.tags?.length) {
      jobs = jobs.filter((job) => options.tags!.some((tag) => job.tags?.includes(tag)));
    }
    return options.limit ? jobs.slice(0, options.limit) : jobs;
  }

  /** List jobs with registry filter options. */
  list(options?: JobFilterOptions): Promise<readonly JobDefinition[]> {
    return this.listJobs(options);
  }

  /** List enabled jobs that define a schedule. */
  listScheduled(): Promise<readonly JobDefinition[]> {
    return this.listJobs({ enabled: true, scheduled: true });
  }

  /** Update an existing job definition. */
  async update(
    jobId: string,
    updates: Partial<Omit<RegisterJobInput, 'id'>>,
  ): Promise<JobDefinition> {
    const existing = await this.get(jobId);
    if (!existing) {
      throw new Error(`Job '${jobId}' not found`);
    }
    const updated = normalizeJobDefinition(
      { ...existing, ...updates, id: jobId } as RegisterJobInput,
    );
    await this.register(jobId, updated);
    return updated;
  }

  /** Remove a job definition by id. */
  async unregister(jobId: string): Promise<boolean> {
    const existing = await this.get(jobId);
    if (!existing) return false;
    await this.#kv.delete([...JOB_PREFIX, jobId]);
    return true;
  }

  /** Enable a job definition. */
  async enable(jobId: string): Promise<boolean> {
    return await this.setEnabled(jobId, true);
  }

  /** Disable a job definition. */
  async disable(jobId: string): Promise<boolean> {
    return await this.setEnabled(jobId, false);
  }

  /** Save a job execution record. */
  async saveExecution(record: ExecutionRecord): Promise<void> {
    await this.#kv.set([...EXECUTION_PREFIX, record.id], record);
  }

  /** Find a job execution record by id. */
  async findExecution(executionId: string): Promise<ExecutionRecord | undefined> {
    const entry = await this.#kv.get<ExecutionRecord>([...EXECUTION_PREFIX, executionId]);
    return entry?.value ?? undefined;
  }

  /** Set a job enabled state. */
  private async setEnabled(jobId: string, enabled: boolean): Promise<boolean> {
    const existing = await this.get(jobId);
    if (!existing) return false;
    await this.register(jobId, { ...existing, enabled });
    return true;
  }
}

function normalizeJobDefinition(input: RegisterJobInput): JobDefinition {
  return JobDefinitionSchema.parse({
    ...input,
    id: input.id ?? crypto.randomUUID(),
    topic: input.topic ?? DEFAULT_TOPIC,
    source: input.source ?? 'local',
    executionType: input.executionType ?? 'deno',
    timezone: input.timezone ?? 'UTC',
    timeout: input.timeout ?? 300000,
    maxRetries: input.maxRetries ?? 3,
    retryDelay: input.retryDelay ?? 1000,
    maxConcurrency: input.maxConcurrency ?? 1,
    priority: input.priority ?? 50,
    enabled: input.enabled ?? true,
    persist: input.persist ?? true,
    tags: input.tags ?? [],
  }) as JobDefinition;
}
