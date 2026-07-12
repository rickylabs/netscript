import type {
  JobContext as DomainJobContext,
  JobDefinition as DomainJobDefinition,
  JobHandler as DomainJobHandler,
  JobId as DomainJobId,
  JobResult as DomainJobResult,
  TaskDefinition as DomainTaskDefinition,
  TaskHandler as DomainTaskHandler,
  TaskId as DomainTaskId,
  WorkflowDefinition as DomainWorkflowDefinition,
  WorkflowId as DomainWorkflowId,
  WorkflowStep as DomainWorkflowStep,
} from '../domain/mod.ts';

/** Branded worker job identifier used by builder surfaces. */
export type JobId<TId extends string = string> = DomainJobId<TId>;

/** Branded worker task identifier used by builder surfaces. */
export type TaskId<TId extends string = string> = DomainTaskId<TId>;

/** Branded worker workflow identifier used by builder surfaces. */
export type WorkflowId<TId extends string = string> = DomainWorkflowId<TId>;

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
export type JobResult<TResult = unknown> = DomainJobResult<TResult>;

/** Context passed to job handlers declared with the builder. */
export type JobHandlerContext<TPayload = unknown, TResult = unknown> = DomainJobContext<
  TPayload,
  TResult
>;

/** Function that executes a job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = DomainJobHandler<
  TPayload,
  TResult
>;

/** Public job definition produced by the job builder. */
export type JobDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = DomainJobDefinition<TId, TPayload, TResult>;

/** Function that executes a task. */
export type TaskHandler<TPayload = unknown, TResult = unknown> = DomainTaskHandler<
  TPayload,
  TResult
>;

/** Public task definition produced by the task builder. */
export type TaskDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = DomainTaskDefinition<TId, TPayload, TResult>;

/** Single workflow step produced by the workflow builder. */
export type WorkflowStep = DomainWorkflowStep;

/** Public workflow definition produced by the workflow builder. */
export type WorkflowDefinition<TId extends string = string> = DomainWorkflowDefinition<TId>;
