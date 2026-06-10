/**
 * @module @netscript/plugin-workers-core/builders
 *
 * Typestate builder contracts for worker job, task, and workflow definitions.
 */

export { defineJob } from './job-builder.ts';
export type { JobBuilder, JobBuilderState, RetryOptions } from './job-builder.ts';
export type { JobRetentionOptions } from './job-builder.ts';
export { defineTask } from './task-builder.ts';
export type { TaskBuilder, TaskBuilderState } from './task-builder.ts';
export { defineWorkflow } from './workflow-builder.ts';
export type {
  WorkflowBuilder,
  WorkflowBuilderState,
  WorkflowJobStepOptions,
  WorkflowTaskStepOptions,
} from './workflow-builder.ts';
export type {
  BuilderPermissions,
  BuilderPermissionValue,
  BuilderTaskType,
  JobDefinition,
  JobHandler,
  JobHandlerContext,
  JobId,
  JobResult,
  TaskDefinition,
  TaskHandler,
  TaskId,
  WorkflowDefinition,
  WorkflowId,
  WorkflowStep,
} from './builder-types.ts';
export type { CronExpression } from '../domain/mod.ts';
