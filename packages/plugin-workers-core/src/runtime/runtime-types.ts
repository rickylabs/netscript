/** Runtime job identifier. */
export type JobId<TId extends string = string> = TId & { readonly __brand: 'JobId' };

/** Runtime task identifier. */
export type TaskId<TId extends string = string> = TId & { readonly __brand: 'TaskId' };

/** Runtime workflow identifier. */
export type WorkflowId<TId extends string = string> = TId & { readonly __brand: 'WorkflowId' };

/** Result returned by runtime job handlers. */
export type JobResult<TResult = unknown> =
  | Readonly<{ success: true; data?: TResult }>
  | Readonly<{ success: false; error: string; data?: TResult }>;

/** Context supplied to runtime job handlers. */
export type JobContext<TPayload = unknown, TResult = unknown> = Readonly<{
  readonly id: string;
  readonly job: JobDefinition<string, TPayload, TResult>;
  readonly payload: TPayload;
  readonly correlationId?: string;
  readonly traceparent?: string;
  readonly tracestate?: string;
}>;

/** Function that executes a runtime job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobContext<TPayload, TResult>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

/** Runtime job definition. */
export type JobDefinition<TId extends string = string, TPayload = unknown, TResult = unknown> =
  Readonly<Record<string, unknown> & {
    readonly id: TId;
    readonly name?: string;
    readonly topic?: string;
    readonly entrypoint?: string;
    readonly sourceUrl?: string;
    readonly handler?: JobHandler<TPayload, TResult>;
  }>;

/** Runtime task definition. */
export type TaskDefinition<TId extends string = string, TPayload = unknown, TResult = unknown> =
  Readonly<Record<string, unknown> & {
    readonly id: TId;
    readonly name?: string;
    readonly topic?: string;
    readonly type: string;
    readonly entrypoint?: string;
    readonly handler?: (context: Readonly<{ id: string; payload: TPayload }>) => TResult;
  }>;

/** Runtime execution record. */
export type ExecutionRecord = Readonly<Record<string, unknown> & {
  readonly id: string;
  readonly concept: 'job' | 'task';
  readonly status: string;
  readonly topic: string;
}>;

/** Message enqueued to trigger a job execution. */
export type JobMessage = Readonly<Record<string, unknown> & {
  readonly jobId: string;
  readonly topic: string;
}>;

/** Message enqueued to trigger a task execution. */
export type TaskMessage = Readonly<Record<string, unknown> & {
  readonly taskId: string;
  readonly topic: string;
}>;

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
export type RuntimeJobStoragePort = Readonly<{
  readonly id: string;
  saveJob(job: JobDefinition): Promise<void>;
  findJob(jobId: string): Promise<JobDefinition | undefined>;
  listJobs(topic?: string): Promise<readonly JobDefinition[]>;
  saveExecution(record: ExecutionRecord): Promise<void>;
  findExecution(executionId: string): Promise<ExecutionRecord | undefined>;
}>;

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
export type RuntimeTaskExecutor = Readonly<{
  readonly id: string;
  supports(task: TaskDefinition): boolean;
  execute(task: TaskDefinition, options?: TaskExecutionOptions): Promise<TaskResult>;
}>;

/** Runtime task executor configuration. */
export type RuntimeTaskExecutorOptions = Readonly<Record<string, unknown>>;

/** Runtime workflow executor contract. */
export type RuntimeWorkflowExecutor = Readonly<{
  readonly id: string;
  execute(workflow: RuntimeWorkflowDefinition, options?: RuntimeWorkflowOptions): Promise<unknown>;
}>;

/** Runtime workflow definition accepted by composition. */
export type RuntimeWorkflowDefinition = Readonly<Record<string, unknown> & {
  readonly id: WorkflowId | string;
  readonly name: string;
}>;

/** Runtime workflow executor options. */
export type RuntimeWorkflowOptions = Readonly<{
  readonly clock?: unknown;
  readonly runJobStep?: unknown;
  readonly runTaskStep?: unknown;
  readonly sleep?: unknown;
  readonly stateStore?: unknown;
}>;

/** Runtime shutdown manager contract. */
export type RuntimeShutdownManager = Readonly<{
  readonly id: string;
  register(resource: RuntimeShutdownResource): void;
  shutdown(reason?: string): Promise<void>;
}>;

/** Resource managed during runtime shutdown. */
export type RuntimeShutdownResource = Readonly<{
  readonly id: string;
  readonly priority?: number;
  stop(reason?: string): Promise<void> | void;
}>;

/** Runtime shutdown configuration. */
export type RuntimeShutdownOptions = Readonly<Record<string, unknown>>;

/** Public shape for runtime KV key factories. */
export type RuntimeJobKvKeyFactories = Readonly<{
  readonly execution: (topic: string, jobId: string, executionId: string) => readonly unknown[];
  readonly byTopic: (topic: string) => readonly unknown[];
  readonly byJob: (topic: string, jobId: string) => readonly unknown[];
  readonly allExecutions: () => readonly unknown[];
  readonly taskExecution: (topic: string, taskId: string, executionId: string) => readonly unknown[];
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
