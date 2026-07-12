/**
 * @module @netscript/plugin-workers-core/runtime
 *
 * Worker runtime composition and runner contracts.
 */

import {
  DEFAULT_TOPIC,
  JobKvKeys as DomainJobKvKeys,
  SSEEventTypes,
  TriggerTypeSchema,
} from '../domain/mod.ts';
import type { RuntimeJobKvKeyFactories } from './runtime-types.ts';

export { DEFAULT_TOPIC, SSEEventTypes };
// Canonical execution status / trigger enums. Re-exported from the runtime
// entrypoint so consumer ports (e.g. the worker `WorkerExecutionState`) can
// type `status` / `triggeredBy` with the same enums the runtime records carry,
// instead of widening them to bare `string`. The `TriggerTypeSchema` value is
// re-exported so wire-message consumers can narrow an untyped `triggeredBy`
// string back to the enum at the deserialization boundary.
export { TriggerTypeSchema };
export type { ExecutionStatus, TriggerType, TriggerTypeSchemaValues } from '../domain/constants.ts';
export type {
  JobContext as RuntimeDomainJobContext,
  JobDefinition as RuntimeDomainJobDefinition,
  JobFailure,
  JobFailure as RuntimeDomainJobFailure,
  JobHandler as RuntimeDomainJobHandler,
  JobId as RuntimeDomainJobId,
  JobResult as RuntimeDomainJobResult,
  JobSuccess,
  JobSuccess as RuntimeDomainJobSuccess,
  StoredJobDefinition,
  StoredJobDefinition as RuntimeStoredJobDefinition,
  StoredTaskDefinition,
  StoredTaskDefinition as RuntimeStoredTaskDefinition,
  TaskContext,
  TaskDefinition as RuntimeDomainTaskDefinition,
  TaskHandler,
  TaskHandler as RuntimeDomainTaskHandler,
  TaskId as RuntimeDomainTaskId,
  TaskPermissionsInput,
  TaskPermissionsInput as RuntimeTaskPermissionsInput,
  TaskType,
  TaskType as RuntimeDomainTaskType,
  WorkflowDefinition as RuntimeDomainWorkflowDefinition,
  WorkflowId as RuntimeDomainWorkflowId,
  WorkflowStep,
  WorkflowStep as RuntimeDomainWorkflowStep,
  WorkflowStepKind,
} from '../domain/mod.ts';
export type {
  JobSource,
  RuntimePermissions as RegistryRuntimePermissions,
} from '../registry/mod.ts';
export type {
  ExecutionRecord as RuntimeRegistryExecutionRecord,
  JobDefinition as RuntimeRegistryJobDefinition,
  RegistryJobStoragePort as RuntimeRegistryJobStoragePort,
} from '../registry/mod.ts';
export type { TaskExecutor as RuntimeTaskExecutorContract } from '../abstracts/task-executor.ts';
export type {
  MultiRuntimeTaskExecutorOptions as RuntimeDefaultTaskExecutorOptions,
  ResolvedTaskExecutionOptions,
  RuntimeTaskMetadata,
  TaskDefinition as RuntimeExecutorTaskDefinition,
  TaskExecutionOptions as RuntimeExecutorTaskExecutionOptions,
  TaskInstrumentationLike as RuntimeTaskInstrumentationLike,
  TaskInstrumentationSpan,
  TaskLogEntry,
  TaskResult as RuntimeExecutorTaskResult,
  TaskRuntimeAdapterLike as RuntimeTaskRuntimeAdapterLike,
  TaskType as RuntimeExecutorTaskType,
  WorkerTaskPermissions,
} from '../executor/mod.ts';
export type { WorkerTelemetryStatus } from '../telemetry/mod.ts';
export {
  WorkflowExecutor as RuntimeWorkflowExecutorImplementation,
} from '../workflow/workflow-executor.ts';
export type {
  WorkflowExecutorOptions as RuntimeWorkflowExecutorOptions,
} from '../workflow/workflow-executor.ts';
export type {
  WorkflowJobStepRunner,
  WorkflowStepRunnerOptions as RuntimeWorkflowStepRunnerOptions,
  WorkflowTaskStepRunner,
} from '../workflow/workflow-step-runner.ts';
export type {
  WorkflowClock as RuntimeWorkflowClock,
  WorkflowStateStore as RuntimeWorkflowStateStore,
} from '../workflow/workflow-state.ts';
export type {
  WorkflowDefinition as RuntimeExecutorWorkflowDefinition,
  WorkflowEvent as RuntimeWorkflowEvent,
  WorkflowExecutionOptions as RuntimeWorkflowExecutionOptions,
  WorkflowExecutionStatus,
  WorkflowResults,
  WorkflowState as RuntimeWorkflowState,
  WorkflowStepResult,
  WorkflowStepStatus,
} from '../workflow/workflow-types.ts';
export { ShutdownManager as RuntimeShutdownManagerImplementation } from '../shutdown/mod.ts';
export type {
  ShutdownManagerOptions as RuntimeShutdownManagerOptions,
  ShutdownReport as RuntimeShutdownReport,
  ShutdownResource as RuntimeShutdownResourceContract,
  ShutdownState as RuntimeShutdownState,
} from '../shutdown/mod.ts';
export { createWorkersRuntime } from './composition-root.ts';
export { resolveWorkerIdempotencyKey } from './worker-idempotency.ts';
export type { WorkerResolvedIdempotencyKey } from './worker-idempotency.ts';
export type {
  TaskRegistryPort,
  WorkersClock,
  WorkersRuntime,
  WorkersRuntimeOptions,
} from './composition-root.ts';
export type {
  ExecutionRecord,
  JobContext,
  JobDefinition,
  JobDispatcherOptions,
  JobHandler,
  JobId,
  JobMessage,
  JobModuleImporter,
  JobResolution,
  JobResolutionSource,
  JobResult,
  RegisterJobInput,
  RegisterTaskInput,
  RuntimeJobKvKeyFactories,
  RuntimeJobStoragePort,
  RuntimePermissions,
  RuntimePermissionValue,
  RuntimeSchedulerPort,
  RuntimeShutdownManager,
  RuntimeShutdownOptions,
  RuntimeShutdownResource,
  RuntimeTaskExecutor,
  RuntimeTaskExecutorOptions,
  RuntimeWorkerPort,
  RuntimeWorkflowDefinition,
  RuntimeWorkflowExecutor,
  RuntimeWorkflowOptions,
  StaticJobRegistry,
  TaskDefinition,
  TaskExecutionOptions,
  TaskId,
  TaskMessage,
  TaskResult,
  WorkflowId,
} from './runtime-types.ts';

/** KV key factories used by the runtime storage adapters. */
export const JobKvKeys: RuntimeJobKvKeyFactories = DomainJobKvKeys;

export { InProcessJobDispatcher } from './job-dispatcher.ts';
export { InProcessJobRunner } from './in-process-job-runner.ts';
export type { InProcessJobRunnerOptions } from './in-process-job-runner.ts';
export { JOB_STATE_CHANNEL } from './messages.ts';
export type {
  ExecuteJobMessage,
  JobCompleteMessage,
  JobErrorMessage,
  JobLogMessage,
  JobProgressMessage,
  StateUpdateMessage,
  TerminateMessage,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './messages.ts';
export type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
  WorkerIdempotencySource,
} from '../ports/worker-idempotency-port.ts';
