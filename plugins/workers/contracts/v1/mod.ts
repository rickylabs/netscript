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
  ExecutionStatus,
  JobContext,
  JobDefinition,
  JobFailure,
  JobHandler,
  JobMessage,
  JobPayloadSchema,
  JobResult,
  JobSuccess,
  PublicStandardSchema,
  RegisterJobInput,
  RegisterTaskInput,
  RuntimePermissions,
  RuntimePermissionValue,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
  TaskResult,
  TriggerType,
} from '@netscript/plugin-workers-core/runtime';
