import type { ExecutionStatus, TriggerType } from '../domain/constants.ts';
import type { JobResult as DomainJobResult } from '../domain/mod.ts';
import type { TaskExecutor } from '../abstracts/task-executor.ts';
import type { MultiRuntimeTaskExecutorOptions } from '../executor/mod.ts';
import type { RegistryJobStoragePort } from '../registry/mod.ts';
import type { ShutdownManager, ShutdownManagerOptions, ShutdownResource } from '../shutdown/mod.ts';
import type { WorkflowExecutor, WorkflowExecutorOptions } from '../workflow/mod.ts';
import type { WorkflowDefinition as DomainWorkflowDefinition } from '../domain/mod.ts';

/** Runtime job identifier. */
export type JobId<TId extends string = string> = TId & { readonly __brand: 'JobId' };

/** Runtime task identifier. */
export type TaskId<TId extends string = string> = TId & { readonly __brand: 'TaskId' };

/** Runtime workflow identifier. */
export type WorkflowId<TId extends string = string> = TId & { readonly __brand: 'WorkflowId' };

/** Result returned by runtime job handlers. */
export type JobResult<TResult = unknown> = DomainJobResult<TResult>;

/** Context supplied to runtime job handlers. */
export type JobContext<TPayload = unknown, TResult = unknown> = Readonly<{
  readonly id: string;
  readonly job: JobDefinition<string, TPayload, TResult>;
  readonly payload: TPayload;
  readonly correlationId?: string;
  readonly traceparent?: string;
  readonly tracestate?: string;
  readonly reportProgress?: (percent: number, message?: string) => void;
}>;

/** Function that executes a runtime job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobContext<TPayload, TResult>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

/** Runtime permission value accepted by task and job execution. */
export type RuntimePermissionValue = boolean | string[];

/** Runtime permission bag accepted by task and job execution. */
export type RuntimePermissions = Readonly<{
  readonly net?: RuntimePermissionValue;
  readonly read?: RuntimePermissionValue;
  readonly write?: RuntimePermissionValue;
  readonly env?: RuntimePermissionValue;
  readonly run?: RuntimePermissionValue;
  readonly ffi?: boolean;
  readonly import?: string[];
}>;

/** Runtime job definition. */
export type JobDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = Readonly<
  Record<string, unknown> & {
    readonly id: TId;
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
    readonly source?: string;
    readonly sourceUrl?: string;
    readonly importMapUrl?: string;
    readonly executionType?: string;
    readonly pluginId?: string;
    readonly permissions?: RuntimePermissions;
    readonly handler?: JobHandler<TPayload, TResult>;
  }
>;

/** Runtime task definition. */
export type TaskDefinition<TId extends string = string, TPayload = unknown, TResult = unknown> =
  Readonly<
    Record<string, unknown> & {
      readonly id: TId;
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
      readonly source?: string;
      readonly sourceUrl?: string;
      readonly importMapUrl?: string;
      readonly args?: string[];
      readonly cwd?: string;
      readonly env?: Record<string, string>;
      readonly permissions?: RuntimePermissions;
      readonly pluginId?: string;
      readonly inlineScript?: string;
      readonly handler?: (context: Readonly<{ id: string; payload: TPayload }>) => TResult;
    }
  >;

/**
 * Runtime execution record.
 *
 * `status` and `triggeredBy` are the canonical domain enums (not bare `string`),
 * and the record carries no `Record<string, unknown>` index signature. Both were
 * deliberate corrections: the previous `string` fields and index signature caused
 * the workers connector handlers — which annotate their working arrays with this
 * type — to widen `status`/`triggeredBy` to `string`, breaking conformance with
 * the `ExecutionRecordResponse` contract enums.
 */
export type ExecutionRecord = Readonly<
  {
    readonly id: string;
    readonly concept: 'job' | 'task';
    readonly jobId: string;
    readonly status: ExecutionStatus;
    readonly topic: string;
    readonly triggeredBy: TriggerType;
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

/** Message enqueued to trigger a job execution. */
export type JobMessage = Readonly<
  Record<string, unknown> & {
    readonly jobId: string;
    readonly topic: string;
    readonly triggeredBy: string;
    readonly triggeredAt?: string;
    readonly payload?: Record<string, unknown>;
    readonly idempotencyKey?: string;
    readonly priority?: number;
    readonly correlationId?: string;
    readonly traceparent?: string;
    readonly tracestate?: string;
  }
>;

/** Message enqueued to trigger a task execution. */
export type TaskMessage = Readonly<
  Record<string, unknown> & {
    readonly taskId: string;
    readonly topic: string;
    readonly triggeredBy: string;
    readonly triggeredAt?: string;
    readonly payload?: Record<string, unknown>;
    readonly idempotencyKey?: string;
    readonly priority?: number;
    readonly correlationId?: string;
    readonly traceparent?: string;
    readonly tracestate?: string;
  }
>;

/** Input for registering a job definition. */
export type RegisterJobInput = Readonly<Record<string, unknown> & { readonly id?: string }>;

/** Input for registering a task definition. */
export type RegisterTaskInput = Readonly<Record<string, unknown> & { readonly id?: string }>;

/** Options supplied when executing a task. */
export type TaskExecutionOptions = Readonly<Record<string, unknown>>;

/** Result returned by task execution. */
export type TaskResult = Readonly<Record<string, unknown> & { readonly success: boolean }>;

/** Registry of statically imported runtime job handlers. */
export type StaticJobRegistry = ReadonlyMap<string, JobHandler>;

/** Dynamic runtime module importer. */
export type JobModuleImporter = (specifier: string) => Promise<Readonly<Record<string, unknown>>>;

/** Runtime job handler resolution source. */
export type JobResolutionSource = 'definition' | 'dynamic-import' | 'static-registry';

/** Result of resolving a runtime job handler. */
export type JobResolution<TPayload = unknown, TResult = unknown> = Readonly<{
  readonly handler: JobHandler<TPayload, TResult>;
  readonly source: JobResolutionSource;
}>;

/** Options for resolving runtime job handlers. */
export type JobDispatcherOptions = Readonly<{
  readonly registry?: StaticJobRegistry;
  readonly fallbackToDynamicImport?: boolean;
  readonly importModule?: JobModuleImporter;
}>;

/** Runtime job storage contract. */
export type RuntimeJobStoragePort = RegistryJobStoragePort;

/** Runtime scheduler contract. */
export type RuntimeSchedulerPort = Readonly<{
  readonly id: string;
  schedule(job: JobDefinition): Promise<void>;
  enqueue(message: JobMessage): Promise<void>;
  stop(reason?: string): Promise<void>;
}>;

/** Runtime worker dispatch contract. */
export type RuntimeWorkerPort = Readonly<{
  readonly id: string;
  dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>>;
  stop(reason?: string): Promise<void>;
}>;

/** Runtime task executor contract. */
export type RuntimeTaskExecutor = Readonly<Pick<TaskExecutor, 'execute' | 'id' | 'supports'>>;

/** Runtime task executor configuration. */
export type RuntimeTaskExecutorOptions = MultiRuntimeTaskExecutorOptions;

/** Runtime workflow executor contract. */
export type RuntimeWorkflowExecutor = Readonly<
  Pick<WorkflowExecutor, 'execute'> & { readonly id: string }
>;

/** Runtime workflow definition accepted by composition. */
export type RuntimeWorkflowDefinition<TId extends string = string> = DomainWorkflowDefinition<TId>;

/** Runtime workflow executor options. */
export type RuntimeWorkflowOptions = WorkflowExecutorOptions;

/** Runtime shutdown manager contract. */
export type RuntimeShutdownManager = Readonly<
  Pick<ShutdownManager, 'register' | 'shutdown'> & { readonly id: string }
>;

/** Resource managed during runtime shutdown. */
export type RuntimeShutdownResource = ShutdownResource;

/** Runtime shutdown configuration. */
export type RuntimeShutdownOptions = ShutdownManagerOptions;

/** Public shape for runtime KV key factories. */
export type RuntimeJobKvKeyFactories = Readonly<{
  readonly execution: (topic: string, jobId: string, executionId: string) => readonly unknown[];
  readonly byTopic: (topic: string) => readonly unknown[];
  readonly byJob: (topic: string, jobId: string) => readonly unknown[];
  readonly allExecutions: () => readonly unknown[];
  readonly taskExecution: (
    topic: string,
    taskId: string,
    executionId: string,
  ) => readonly unknown[];
  readonly taskByTopic: (topic: string) => readonly unknown[];
  readonly taskByTask: (topic: string, taskId: string) => readonly unknown[];
  readonly allTaskExecutions: () => readonly unknown[];
  readonly allConceptExecutions: () => readonly unknown[];
  readonly job: (topic: string, jobId: string) => readonly unknown[];
  readonly jobsByTopic: (topic: string) => readonly unknown[];
  readonly allJobs: () => readonly unknown[];
  readonly stats: (topic: string, jobId: string) => readonly unknown[];
  readonly jobDefinition: (jobId: string) => readonly unknown[];
  readonly taskDefinition: (taskId: string) => readonly unknown[];
  readonly allTasks: () => readonly unknown[];
  readonly byStatus: (status: string, concept: string, executionId: string) => readonly unknown[];
  readonly byStatusPrefix: (status: string, concept: string) => readonly unknown[];
  readonly byStatusAllPrefix: (status: string) => readonly unknown[];
  readonly byCorrelation: (correlationId: string, executionId: string) => readonly unknown[];
  readonly byCorrelationPrefix: (correlationId: string) => readonly unknown[];
  readonly statusCount: (concept: string, status: string) => readonly unknown[];
  readonly statusCountPrefix: (concept: string) => readonly unknown[];
}>;
