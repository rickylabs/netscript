/**
 * Workers Plugin Contracts - Version 1.
 *
 * Re-exports the workers core contract surface owned by
 * `@netscript/plugin-workers-core`.
 *
 * @module
 */

export * from '@netscript/plugin-workers-core/contracts/v1';
export type {
  ExecutionRecord,
  JobContext,
  JobDefinition,
  JobHandler,
  JobMessage,
  JobResult,
  RegisterJobInput,
  RegisterTaskInput,
  RuntimePermissions,
  RuntimePermissionValue,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
  TaskResult,
} from '@netscript/plugin-workers-core/runtime';
