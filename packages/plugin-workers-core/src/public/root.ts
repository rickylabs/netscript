import { defineJob as defineJobImpl } from '../builders/job-builder.ts';
import { defineTask as defineTaskImpl } from '../builders/task-builder.ts';
import { defineWorkflow as defineWorkflowImpl } from '../builders/workflow-builder.ts';
import { cron as cronImpl } from '../domain/cron.ts';
import {
  createFailureResult as createFailureResultImpl,
  createSuccessResult as createSuccessResultImpl,
} from '../domain/job-result.ts';
import { permissions as permissionsImpl } from '../domain/permissions.ts';
import { startWorkers as startWorkersImpl } from '../presets/mod.ts';
import {
  createWorkersRuntime as createWorkersRuntimeImpl,
  type WorkersRuntimeOptions as RuntimeOptions,
} from '../runtime/mod.ts';
export type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
  WorkerIdempotencySource,
} from '../ports/mod.ts';

/** Branded worker job identifier. */
export type JobId<TId extends string = string> = TId & { readonly __brand: 'JobId' };

/** Branded worker task identifier. */
export type TaskId<TId extends string = string> = TId & { readonly __brand: 'TaskId' };

/** Cron schedule helper surface for worker jobs. */
export type CronHelpers = Readonly<{
  everyMinute(): string;
  everyNMinutes(minutes: number): string;
  every5Minutes(): string;
  every10Minutes(): string;
  every15Minutes(): string;
  every30Minutes(): string;
  hourly(minute?: number): string;
  daily(hour?: number, minute?: number): string;
  weekly(dayOfWeek?: number, hour?: number, minute?: number): string;
  custom(
    minute: string | number,
    hour: string | number,
    dayOfMonth: string | number,
    month: string | number,
    dayOfWeek: string | number,
  ): string;
  validate(expression: string): boolean;
}>;

/** Worker permission preset surface for common job execution modes. */
export type PermissionPresets = Readonly<{
  minimal: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  none: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  network: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  filesystem: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  readOnly: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  subprocess: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  full: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
  allAccess: Readonly<{
    net: boolean | string[];
    read: boolean | string[];
    write: boolean | string[];
    env: boolean | string[];
    run: boolean | string[];
    ffi: boolean;
  }>;
}>;

/** Result returned by worker job handlers. */
export type JobResult<TResult = unknown> =
  | Readonly<{
    success: true;
    data?: TResult;
  }>
  | Readonly<{
    success: false;
    error: string;
    data?: TResult;
  }>;

/** Context passed to root-surface job handlers. */
export type JobHandlerContext<TPayload = unknown> = Readonly<{
  id: string;
  job?: Readonly<{ id: string }>;
  payload: TPayload;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
  reportProgress?: (percent: number, message?: string) => void | Promise<void>;
}>;

/** Root-surface job definition derived from the thin public schema. */
export type JobDefinition<TId extends string = string> = Readonly<{
  id: JobId<TId>;
  entrypoint?: string;
  name?: string;
  topic?: string;
}>;

/** Root-surface task definition derived from the thin public schema. */
export type TaskDefinition<TId extends string = string> = Readonly<{
  id: TaskId<TId>;
  entrypoint?: string;
  name?: string;
  topic?: string;
  type?: string;
}>;

/** Root-surface workflow definition derived from the thin public schema. */
export type WorkflowDefinition<TId extends string = string> = Readonly<{
  id: TId;
  steps?: readonly Record<string, unknown>[];
}>;

/** Root-surface job builder typestate API. */
export interface JobBuilder<
  TId extends string,
  TConfigured extends 'initial' | 'entrypoint-set' | 'handler-set',
  TPayload,
  TResult,
> {
  /** Set the module entrypoint that executes the job. */
  entrypoint(path: string): JobBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  /** Set the display name for this job. */
  name(value: string): this;
  /** Set the job description. */
  description(value: string): this;
  /** Set an in-process handler that executes the job. */
  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: (
      context: Readonly<{ id: string; payload: TNextPayload }>,
    ) => JobResult<TNextResult> | Promise<JobResult<TNextResult>>,
  ): JobBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  /** Narrow the payload type carried by this job definition. */
  payload<TNextPayload>(): JobBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Set the cron schedule expression for this job.
   * @deprecated Define recurring work with `defineScheduledTrigger(...).enqueueJob(...)`.
   */
  schedule(expression: string): this;
  /** Set the schedule timezone. */
  timezone(value: string): this;
  /** Set the execution timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set retry count and optional retry behavior. */
  retry(maxRetries: number, options?: Readonly<Record<string, unknown>>): this;
  /** Set execution permissions for this job. */
  permissions(perms: Readonly<Record<string, unknown>>): this;
  /** Add tags to this job definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this job definition. */
  metadata(data: Record<string, unknown>): this;
  /** Set execution retention policy for this job. */
  retention(options: Readonly<Record<string, unknown>>): this;
  /** Enable or disable this job definition. */
  enabled(value: boolean): this;
  /** Set the worker topic for this job. */
  topic(name: string): this;
  /** Set the queue trigger name for this job. */
  queueTrigger(name: string): this;
  /** Build the job definition after an entrypoint or handler has been configured. */
  build(): TConfigured extends 'entrypoint-set' | 'handler-set' ? JobDefinition<TId> : never;
}

/** Root-surface task builder typestate API. */
export interface TaskBuilder<
  TId extends string,
  TConfigured extends 'initial' | 'entrypoint-set' | 'handler-set',
  TPayload,
  TResult,
> {
  /** Set the task runtime. */
  runtime(type: string): this;
  /** Set the module, script, or executable entrypoint. */
  entrypoint(path: string): TaskBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  /** Set an in-process task handler. */
  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: (
      context: Readonly<{ id: string; payload: TNextPayload }>,
    ) => TNextResult | Promise<TNextResult>,
  ): TaskBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  /** Narrow the payload type carried by this task definition. */
  payload<TNextPayload>(): TaskBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Set the task timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set the maximum retry count. */
  retry(maxRetries: number): this;
  /** Set execution permissions for this task. */
  permissions(perms: Readonly<Record<string, unknown>>): this;
  /** Append command-line arguments. */
  args(...args: string[]): this;
  /** Merge environment variables. */
  env(vars: Record<string, string>): this;
  /** Set the working directory. */
  workingDir(path: string): this;
  /** Add tags to this task definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this task definition. */
  metadata(data: Record<string, unknown>): this;
  /** Enable or disable this task definition. */
  enabled(value: boolean): this;
  /** Build the task definition after an entrypoint or handler has been configured. */
  build(): TConfigured extends 'entrypoint-set' | 'handler-set' ? TaskDefinition<TId> : never;
}

/** Root-surface workflow builder typestate API. */
export interface WorkflowBuilder<
  TId extends string,
  TConfigured extends 'initial' | 'step-set',
  TPayload,
  TResult,
> {
  /** Narrow the payload type carried by this workflow definition. */
  payload<TNextPayload>(): WorkflowBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Add a job-backed workflow step. */
  jobStep(id: string, options: Readonly<{ jobId: string; payload?: TPayload }>): WorkflowBuilder<
    TId,
    'step-set',
    TPayload,
    TResult
  >;
  /** Add a task-backed workflow step. */
  taskStep(id: string, options: Readonly<{ taskId: string; payload?: TPayload }>): WorkflowBuilder<
    TId,
    'step-set',
    TPayload,
    TResult
  >;
  /** Add a sleep step. */
  sleep(id: string, durationMs: number): WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  /** Add tags to this workflow definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this workflow definition. */
  metadata(data: Record<string, unknown>): this;
  /** Set the workflow timeout in milliseconds. */
  timeout(ms: number): this;
  /** Build the workflow definition after at least one step has been configured. */
  build(): TConfigured extends 'step-set' ? WorkflowDefinition<TId> : never;
}

/** Minimal workers runtime handle returned by root helpers. */
export type WorkersRuntime = Readonly<{
  readonly id: string;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
}>;

/** Minimal root options for starting a workers runtime. */
export type StartWorkersOptions =
  & Readonly<{
    id?: string;
    fallbackToDynamicImport?: boolean;
  }>
  & Readonly<{
    autoStart?: boolean;
  }>;

/** Start a worker job definition chain. */
export function defineJob<TId extends string>(
  id: TId,
): JobBuilder<TId, 'initial', unknown, unknown> {
  return defineJobImpl(id) as JobBuilder<TId, 'initial', unknown, unknown>;
}

/** Start a worker task definition chain. */
export function defineTask<TId extends string>(
  id: TId,
): TaskBuilder<TId, 'initial', unknown, unknown> {
  return defineTaskImpl(id) as TaskBuilder<TId, 'initial', unknown, unknown>;
}

/** Start a worker workflow definition chain. */
export function defineWorkflow<TId extends string>(
  id: TId,
): WorkflowBuilder<TId, 'initial', unknown, unknown> {
  return defineWorkflowImpl(id) as WorkflowBuilder<TId, 'initial', unknown, unknown>;
}

/** Cron schedule helpers for worker jobs. */
export const cron: CronHelpers = cronImpl;

/** Permission presets for worker jobs and tasks. */
export const permissions: PermissionPresets = permissionsImpl;

/** Define a worker job handler. */
export function defineJobHandler<TPayload = unknown>(
  handler: (
    context: JobHandlerContext<TPayload>,
  ) => JobResult<unknown> | Promise<JobResult<unknown>>,
): (context: JobHandlerContext<TPayload>) => JobResult<unknown> | Promise<JobResult<unknown>> {
  return handler;
}

/** Create a fresh workers runtime from explicit dependencies. */
export function createWorkersRuntime(
  options: Readonly<{ id?: string; fallbackToDynamicImport?: boolean }> = {},
): Readonly<{
  readonly id: string;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
}> {
  return createWorkersRuntimeImpl(options as RuntimeOptions);
}

/** Create a successful job result. */
export function createSuccessResult<TResult = unknown>(data?: TResult): JobResult<TResult> {
  return createSuccessResultImpl(data) as JobResult<TResult>;
}

/** Create a failed job result. */
export function createFailureResult<TResult = unknown>(
  error: string | Error,
  data?: TResult,
): JobResult<TResult> {
  return createFailureResultImpl(error, data) as JobResult<TResult>;
}

/** Create and start a workers runtime using default composition. */
export async function startWorkers(
  options: Readonly<{
    id?: string;
    fallbackToDynamicImport?: boolean;
    autoStart?: boolean;
  }> = {},
): Promise<
  Readonly<{
    readonly id: string;
    start(): Promise<void>;
    stop(reason?: string): Promise<void>;
  }>
> {
  return await startWorkersImpl(options as RuntimeOptions);
}

/** Inspect a job definition without starting a runtime. */
export function inspectJob(job: Readonly<{ id: string }>): Readonly<{ id: string; kind: 'job' }> {
  return Object.freeze({ id: job.id, kind: 'job' });
}

/** Inspect a task definition without starting a runtime. */
export function inspectTask(
  task: Readonly<{ id: string }>,
): Readonly<{ id: string; kind: 'task' }> {
  return Object.freeze({ id: task.id, kind: 'task' });
}

/** Inspect a workflow definition without starting a runtime. */
export function inspectWorkflow(
  workflow: Readonly<{ id: string }>,
): Readonly<{ id: string; kind: 'workflow' }> {
  return Object.freeze({ id: workflow.id, kind: 'workflow' });
}
