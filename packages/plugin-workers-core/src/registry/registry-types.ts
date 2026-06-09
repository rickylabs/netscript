/** Job source value accepted by registry filters. */
export type JobSource = 'database' | 'local' | 'plugin' | 'remote';

/** Task source value accepted by registry filters. */
export type TaskSource = 'inline' | 'local' | 'plugin' | 'remote' | 'shared';

/** Job definition shape stored by registries. */
export type JobDefinition = Readonly<Record<string, unknown> & {
  readonly id: string;
  readonly topic?: string;
  readonly enabled?: boolean;
  readonly schedule?: unknown;
  readonly source?: JobSource;
  readonly pluginId?: string;
  readonly tags?: readonly string[];
}>;

/** Task definition shape stored by registries. */
export type TaskDefinition = Readonly<Record<string, unknown> & {
  readonly id: string;
  readonly topic?: string;
  readonly enabled?: boolean;
  readonly source?: TaskSource;
  readonly pluginId?: string;
  readonly type?: string;
  readonly tags?: readonly string[];
}>;

/** Input accepted when registering a job. */
export type RegisterJobInput = Readonly<Omit<JobDefinition, 'id'> & { readonly id?: string }>;

/** Input accepted when registering a task. */
export type RegisterTaskInput = Readonly<Omit<TaskDefinition, 'id'> & { readonly id?: string }>;

/** Execution record shape stored by job registries. */
export type ExecutionRecord = Readonly<Record<string, unknown> & { readonly id: string }>;

/** Storage contract implemented by job registries. */
export type RegistryJobStoragePort = Readonly<{
  readonly id: string;
  saveJob(job: JobDefinition): Promise<void>;
  findJob(jobId: string): Promise<JobDefinition | undefined>;
  listJobs(topic?: string): Promise<readonly JobDefinition[]>;
  saveExecution(record: ExecutionRecord): Promise<void>;
  findExecution(executionId: string): Promise<ExecutionRecord | undefined>;
}>;
