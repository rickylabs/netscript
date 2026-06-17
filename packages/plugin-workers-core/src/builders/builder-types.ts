/** Branded worker job identifier used by builder surfaces. */
export type JobId<TId extends string = string> = TId & { readonly __brand: 'JobId' };

/** Branded worker task identifier used by builder surfaces. */
export type TaskId<TId extends string = string> = TId & { readonly __brand: 'TaskId' };

/** Branded worker workflow identifier used by builder surfaces. */
export type WorkflowId<TId extends string = string> = TId & { readonly __brand: 'WorkflowId' };

/** Permission value accepted by job and task builders. */
export type BuilderPermissionValue = boolean | readonly string[];

/** Deno permission set accepted by job and task builders. */
export interface BuilderPermissions {
  /** Network permission. */
  readonly net?: BuilderPermissionValue;
  /** File read permission. */
  readonly read?: BuilderPermissionValue;
  /** File write permission. */
  readonly write?: BuilderPermissionValue;
  /** Environment variable permission. */
  readonly env?: BuilderPermissionValue;
  /** Subprocess permission. */
  readonly run?: BuilderPermissionValue;
  /** FFI permission. */
  readonly ffi?: boolean;
  /** Import specifiers allowed for dynamic imports. */
  readonly import?: readonly string[];
}

/** Runtime used to execute a task built by the task builder. */
export type BuilderTaskType =
  | 'deno'
  | 'python'
  | 'dotnet'
  | 'cmd'
  | 'powershell'
  | 'shell'
  | 'executable';

/** Worker job handler result. */
export type JobResult<TResult = unknown> =
  | Readonly<{ success: true; data?: TResult }>
  | Readonly<{ success: false; error: string; data?: TResult }>;

/** Context passed to job handlers declared with the builder. */
export interface JobHandlerContext<TPayload = unknown> {
  /** Job identifier. */
  readonly id: string;
  /** Input payload supplied to the job. */
  readonly payload: TPayload;
  /** Correlation identifier for tracing. */
  readonly correlationId?: string;
  /** W3C traceparent header. */
  readonly traceparent?: string;
  /** W3C tracestate header. */
  readonly tracestate?: string;
}

/** Function that executes a job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobHandlerContext<TPayload>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

/** Public job definition produced by the job builder. */
export interface JobDefinition<TId extends string = string, TPayload = unknown, TResult = unknown> {
  /** Job identifier. */
  readonly id: JobId<TId>;
  /** Queue topic used to route the job. */
  readonly topic: string;
  /** Human-readable job name. */
  readonly name: string;
  /** Optional job description. */
  readonly description?: string;
  /** Module entrypoint used to run the job. */
  readonly entrypoint?: string;
  /** Optional legacy cron schedule. */
  readonly schedule?: string;
  /** Schedule timezone. */
  readonly timezone: string;
  /** Timeout in milliseconds. */
  readonly timeout: number;
  /** Maximum retry attempts. */
  readonly maxRetries: number;
  /** Whether the job can be dispatched. */
  readonly enabled: boolean;
  /** Searchable job tags. */
  readonly tags: readonly string[];
  /** Caller-owned metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Optional in-process handler. */
  readonly handler?: JobHandler<TPayload, TResult>;
}

/** Function that executes a task. */
export type TaskHandler<TPayload = unknown, TResult = unknown> = (
  context: Readonly<{ id: string; payload: TPayload; correlationId?: string }>,
) => TResult | Promise<TResult>;

/** Public task definition produced by the task builder. */
export interface TaskDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> {
  /** Task identifier. */
  readonly id: TaskId<TId>;
  /** Queue topic used to route the task. */
  readonly topic: string;
  /** Human-readable task name. */
  readonly name: string;
  /** Runtime used to execute the task. */
  readonly type: string;
  /** Module, script, or executable entrypoint. */
  readonly entrypoint?: string;
  /** Timeout in milliseconds. */
  readonly timeout: number;
  /** Maximum retry attempts. */
  readonly maxRetries: number;
  /** Whether the task can be dispatched. */
  readonly enabled: boolean;
  /** Searchable task tags. */
  readonly tags: readonly string[];
  /** Caller-owned metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Optional in-process handler. */
  readonly handler?: TaskHandler<TPayload, TResult>;
}

/** Single workflow step produced by the workflow builder. */
export type WorkflowStep = Readonly<{
  readonly id: string;
  readonly kind: 'job' | 'task' | 'sleep';
  readonly jobId?: string;
  readonly taskId?: string;
  readonly payload?: unknown;
  readonly durationMs?: number;
}>;

/** Public workflow definition produced by the workflow builder. */
export interface WorkflowDefinition<TId extends string = string> {
  /** Workflow identifier. */
  readonly id: WorkflowId<TId>;
  /** Ordered workflow steps. */
  readonly steps: readonly WorkflowStep[];
  /** Optional workflow timeout in milliseconds. */
  readonly timeout?: number;
  /** Searchable workflow tags. */
  readonly tags?: readonly string[];
  /** Caller-owned metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
