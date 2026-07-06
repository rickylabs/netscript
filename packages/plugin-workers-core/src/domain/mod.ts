/**
 * @module @netscript/plugin-workers-core/domain
 *
 * Pure workers domain types, constants, and small invariants.
 */

export {
  DEFAULT_TOPIC,
  EXECUTION_STATUSES,
  ExecutionStatusSchema,
  JOB_EXECUTION_TYPES,
  JOB_SOURCES,
  JobExecutionTypeSchema,
  JobSourceSchema,
  TASK_SOURCES,
  TASK_STATUSES,
  TASK_TYPES,
  TaskSourceSchema,
  TaskStatusSchema,
  TaskTypeSchema,
  TRIGGER_TYPES,
  TriggerTypeSchema,
  WORKER_RUNTIMES,
  WorkerRuntimeSchema,
} from './constants.ts';
export type {
  ExecutionStatus,
  ExecutionStatusSchemaValues,
  JobExecutionType,
  JobExecutionTypeSchemaValues,
  JobSource,
  JobSourceSchemaValues,
  TaskSource,
  TaskSourceSchemaValues,
  TaskStatus,
  TaskStatusSchemaValues,
  TaskType,
  TaskTypeSchemaValues,
  TriggerType,
  TriggerTypeSchemaValues,
  WorkerRuntime,
  WorkerRuntimeSchemaValues,
} from './constants.ts';
export { cron, DAY_OF_WEEK, isCronExpression } from './cron.ts';
export type { CronExpression, DayOfWeek } from './cron.ts';
export { createFailureResult, createSuccessResult } from './job-result.ts';
export type { JobFailure, JobResult, JobSuccess } from './job-result.ts';
export type { JobContext } from './job-context.ts';
export type { JobHandler, JobHandlerSpec } from './job-handler.ts';
export {
  ExecutionRecordSchema,
  JobDefinitionSchema,
  JobEditableSchema,
  JobResponseSchema,
  JobSystemSchema,
} from './job-definition.ts';
export type {
  ExecutionRecord,
  ExecutionState,
  JobDefinition,
  JobEditable,
  JobId,
  JobResponse,
  JobSystem,
  StoredJobDefinition,
} from './job-definition.ts';
export {
  JobCompletionEventSchema,
  JobKvKeys,
  JobMessageSchema,
  JobTriggerEventSchema,
  PluginJobContributionSchema,
  RegisterJobInputSchema,
  SSEEventSchema,
  SSEEventTypes,
  TaskMessageSchema,
} from './job-spec.ts';
export type {
  JobCompletionEvent,
  JobMessage,
  JobSpec,
  JobTriggerEvent,
  PluginJobContribution,
  RegisterJobInput,
  SSEEvent,
  SSEEventType,
  TaskMessage,
} from './job-spec.ts';
export { createPermissionPreset, mergePermissions, permissions } from './permissions.ts';
export type { PermissionPreset } from './permissions.ts';
export {
  PublicJobDefinitionSchema,
  PublicTaskDefinitionSchema,
  PublicWorkflowDefinitionSchema,
} from './public-schema.ts';
export {
  DotNetTaskConfigSchema,
  ExtendedTaskDefinitionSchema,
  PythonTaskConfigSchema,
  RegisterTaskInputSchema,
  ShellTaskConfigSchema,
  TaskDefinitionSchema,
  TaskEditableSchema,
  TaskPermissionsInputSchema,
  TaskPermissionsSchema,
  TaskResponseSchema,
  TaskResultSchema,
  TaskSystemSchema,
} from './task.ts';
export type {
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowExecutionOptions,
  WorkflowExecutionStatus,
  WorkflowId,
  WorkflowResults,
  WorkflowState,
  WorkflowStep,
  WorkflowStepKind,
  WorkflowStepResult,
  WorkflowStepStatus,
} from './workflow.ts';
export {
  WorkflowDefinitionSchema,
  WorkflowExecutionStatusSchema,
  WorkflowStateSchema,
  WorkflowStepKindSchema,
  WorkflowStepResultSchema,
  WorkflowStepSchema,
  WorkflowStepStatusSchema,
} from './workflow.ts';
export type {
  DotNetTaskConfig,
  ExtendedTaskDefinition,
  PythonTaskConfig,
  RegisterTaskInput,
  ShellTaskConfig,
  StoredTaskDefinition,
  TaskContext,
  TaskDefinition,
  TaskEditable,
  TaskExecutionOptions,
  TaskHandler,
  TaskId,
  TaskPermissions,
  TaskPermissionsInput,
  TaskResponse,
  TaskResult,
  TaskSpec,
  TaskSystem,
} from './task.ts';
