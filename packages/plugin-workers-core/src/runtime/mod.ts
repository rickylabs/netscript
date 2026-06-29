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
export type { ExecutionStatus, TriggerType } from '../domain/constants.ts';
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
