/** Job source value accepted by registry filters. */
export type JobSource = 'database' | 'local' | 'plugin' | 'remote';

/** Task source value accepted by registry filters. */
export type TaskSource = 'inline' | 'local' | 'plugin' | 'remote' | 'shared';

/**
 * Task execution runtime stored on a task definition.
 *
 * Mirrors the domain `TaskTypeSchema` enum. Stored tasks are normalized through
 * `TaskDefinitionSchema.parse(...)`, so `type` is always one of these literals —
 * typing it as the enum (not bare `string`) keeps the stored task assignable to
 * the `TaskResponseSchema` contract, whose `type` field is the same enum.
 */
export type TaskExecutionType =
  | 'cmd'
  | 'deno'
  | 'dotnet'
  | 'executable'
  | 'powershell'
  | 'python'
  | 'shell';

/**
 * Job definition shape stored by registries.
 *
 * Registries persist only normalized jobs: every write path runs the input
 * through `JobDefinitionSchema.parse(...)`, which applies the schema defaults.
 * Consequently the default-backed fields (`name`, `topic`, `source`,
 * `executionType`, `timezone`, `timeout`, `maxRetries`, `priority`, `enabled`,
 * `tags`, `retryDelay`, `maxConcurrency`, `persist`) are ALWAYS present on a
 * stored job and are typed required here — matching the API `JobResponseSchema`
 * contract. Only genuinely-absent fields (no schema default) stay optional.
 * This precise read-boundary type is what lets the workers connector return
 * contract-conformant jobs without erasing handler return types.
 */
export type JobDefinition = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly topic: string;
    readonly entrypoint?: string;
    readonly schedule?: string;
    readonly timezone: string;
    readonly timeout: number;
    readonly maxRetries: number;
    readonly priority: number;
    readonly enabled: boolean;
    readonly tags: string[];
    readonly metadata?: Record<string, unknown>;
    readonly retryDelay: number;
    readonly maxConcurrency: number;
    readonly persist: boolean;
    readonly source: JobSource;
    readonly sourceUrl?: string;
    readonly importMapUrl?: string;
    readonly executionType: string;
    readonly pluginId?: string;
    readonly permissions?: RuntimePermissions;
  }
>;

/**
 * Task definition shape stored by registries.
 *
 * As with {@link JobDefinition}, every registry write path normalizes through
 * `TaskDefinitionSchema.parse(...)`, so the default-backed fields (`name`,
 * `topic`, `source`, `type`, `timezone`, `timeout`, `maxRetries`, `priority`,
 * `enabled`, `tags`, `args`, `retryDelay`, `maxConcurrency`, `persist`) are
 * ALWAYS present on a stored task and are typed required here — matching the
 * API `TaskResponseSchema` contract. Only genuinely-absent fields stay
 * optional.
 */
export type TaskDefinition = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly topic: string;
    readonly type: TaskExecutionType;
    readonly entrypoint?: string;
    readonly schedule?: string;
    readonly timezone: string;
    readonly timeout: number;
    readonly maxRetries: number;
    readonly priority: number;
    readonly enabled: boolean;
    readonly tags: string[];
    readonly metadata?: Record<string, unknown>;
    readonly retryDelay: number;
    readonly maxConcurrency: number;
    readonly persist: boolean;
    readonly source: TaskSource;
    readonly sourceUrl?: string;
    readonly importMapUrl?: string;
    readonly args: string[];
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
