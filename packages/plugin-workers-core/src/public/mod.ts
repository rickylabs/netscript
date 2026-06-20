export { defineJob, defineTask, defineWorkflow } from '../builders/mod.ts';
export { cron, permissions } from '../domain/mod.ts';
export { createFailureResult, createSuccessResult } from '../domain/mod.ts';
export { startWorkers } from '../presets/mod.ts';
export { createWorkersRuntime } from '../runtime/mod.ts';
export type {
  JobBuilder,
  JobBuilderState,
  RetryOptions,
  TaskBuilder,
  TaskBuilderState,
  WorkflowBuilder,
  WorkflowBuilderState,
  WorkflowJobStepOptions,
  WorkflowTaskStepOptions,
} from '../builders/mod.ts';
export type { StartWorkersOptions } from '../presets/mod.ts';
export type {
  ExecutionState,
  ExecutionStatus,
  JobContext,
  JobDefinition,
  JobFailure,
  JobHandler,
  JobId,
  JobResult,
  JobSpec,
  JobSuccess,
  PermissionPreset,
  TaskContext,
  TaskDefinition,
  TaskHandler,
  TaskId,
  TaskPermissions,
  TaskSpec,
  TaskType,
  WorkflowDefinition,
  WorkflowId,
  WorkflowStep,
  WorkflowStepKind,
} from '../domain/mod.ts';
export type { TaskExecutor } from '../executor/mod.ts';
export type {
  JobStoragePort,
  SchedulerPort,
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
  WorkerIdempotencySource,
  WorkerPort,
} from '../ports/mod.ts';
export type { ShutdownManager, ShutdownManagerOptions } from '../shutdown/mod.ts';
export type {
  StaticJobRegistry,
  TaskRegistryPort,
  WorkersClock,
  WorkersRuntime,
  WorkersRuntimeOptions,
} from '../runtime/mod.ts';
export type { WorkflowExecutor, WorkflowExecutorOptions } from '../workflow/mod.ts';

import type {
  JobDefinition,
  JobHandler,
  TaskDefinition,
  WorkflowDefinition,
} from '../domain/mod.ts';

/** Inspection report returned by worker definition inspectors. */
export type WorkersInspectionReport = Readonly<{
  id: string;
  kind: 'job' | 'task' | 'workflow';
}>;

/**
 * Define a worker job handler.
 *
 * @param handler - Handler function executed by the workers runtime.
 * @returns The same handler for registration.
 */
export function defineJobHandler<TPayload, TResult>(
  handler: JobHandler<TPayload, TResult>,
): JobHandler<TPayload, TResult> {
  return handler;
}

/**
 * Inspect a job definition without starting a runtime.
 *
 * @param job - Job definition to inspect.
 * @returns JSON-stable inspection metadata.
 */
export function inspectJob(job: JobDefinition): WorkersInspectionReport {
  return Object.freeze({ id: job.id, kind: 'job' });
}

/**
 * Inspect a task definition without starting a runtime.
 *
 * @param task - Task definition to inspect.
 * @returns JSON-stable inspection metadata.
 */
export function inspectTask(task: TaskDefinition): WorkersInspectionReport {
  return Object.freeze({ id: task.id, kind: 'task' });
}

/**
 * Inspect a workflow definition without starting a runtime.
 *
 * @param workflow - Workflow definition to inspect.
 * @returns JSON-stable inspection metadata.
 */
export function inspectWorkflow(workflow: WorkflowDefinition): WorkersInspectionReport {
  return Object.freeze({ id: workflow.id, kind: 'workflow' });
}
