/** Job source value accepted by registry filters. */
export type JobSource = 'database' | 'local' | 'plugin' | 'remote';

/** Task source value accepted by registry filters. */
export type TaskSource = 'inline' | 'local' | 'plugin' | 'remote' | 'shared';

/** Job definition shape stored by registries. */
export type JobDefinition = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly topic?: string;
    readonly entrypoint?: string;
    readonly schedule?: string;
    readonly timezone?: string;
    readonly timeout?: number;
    readonly maxRetries?: number;
    readonly priority?: number;
    readonly enabled?: boolean;
    readonly tags?: string[];
    readonly metadata?: Record<string, unknown>;
    readonly retryDelay?: number;
    readonly maxConcurrency?: number;
    readonly persist?: boolean;
    readonly source?: JobSource;
    readonly sourceUrl?: string;
    readonly importMapUrl?: string;
    readonly executionType: string;
    readonly pluginId?: string;
    readonly permissions?: RuntimePermissions;
  }
>;

/** Task definition shape stored by registries. */
export type TaskDefinition = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly topic?: string;
    readonly type: string;
    readonly entrypoint?: string;
    readonly schedule?: string;
    readonly timezone?: string;
    readonly timeout?: number;
    readonly maxRetries?: number;
    readonly priority?: number;
    readonly enabled?: boolean;
    readonly tags?: string[];
    readonly metadata?: Record<string, unknown>;
    readonly retryDelay?: number;
    readonly maxConcurrency?: number;
    readonly persist?: boolean;
    readonly source?: TaskSource;
    readonly sourceUrl?: string;
    readonly importMapUrl?: string;
    readonly args?: string[];
    readonly cwd?: string;
    readonly env?: Record<string, string>;
    readonly permissions?: RuntimePermissions;
    readonly pluginId?: string;
    readonly inlineScript?: string;
  }
>;

/** Runtime permission value accepted by registry task and job definitions. */
export type RuntimePermissionValue = boolean | string[];

/** Runtime permission bag accepted by registry task and job definitions. */
export type RuntimePermissions = Readonly<{
  readonly net: RuntimePermissionValue;
  readonly read: RuntimePermissionValue;
  readonly write: RuntimePermissionValue;
  readonly env: RuntimePermissionValue;
  readonly run: RuntimePermissionValue;
  readonly ffi: boolean;
  readonly import?: string[];
}>;

/** Input accepted when registering a job. */
export type RegisterJobInput = Readonly<Omit<JobDefinition, 'id'> & { readonly id?: string }>;

/** Input accepted when registering a task. */
export type RegisterTaskInput = Readonly<Omit<TaskDefinition, 'id'> & { readonly id?: string }>;

/** Execution record shape stored by job registries. */
export type ExecutionRecord = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly concept: 'job' | 'task';
    readonly jobId: string;
    readonly topic: string;
    readonly status: string;
    readonly triggeredBy: string;
    readonly triggeredAt: string;
    readonly startedAt: string | null;
    readonly completedAt: string | null;
    readonly exitCode: number | null;
    readonly duration: number | null;
    readonly error: string | null;
    readonly result: Record<string, unknown> | null;
    readonly workerId: string | null;
    readonly attempt: number;
    readonly maxAttempts: number;
    readonly payload?: Record<string, unknown>;
    readonly correlationId?: string;
  }
>;

/** Storage contract implemented by job registries. */
export type RegistryJobStoragePort = Readonly<{
  readonly id: string;
  saveJob(job: JobDefinition): Promise<void>;
  findJob(jobId: string): Promise<JobDefinition | undefined>;
  listJobs(topic?: string): Promise<readonly JobDefinition[]>;
  saveExecution(record: ExecutionRecord): Promise<void>;
  findExecution(executionId: string): Promise<ExecutionRecord | undefined>;
}>;
