/**
 * @module @netscript/plugin-workers-core/runtime
 *
 * Worker runtime composition and runner contracts.
 */

import { DEFAULT_TOPIC, JobKvKeys as DomainJobKvKeys, SSEEventTypes } from '../domain/mod.ts';
import type { RuntimeJobKvKeyFactories } from './runtime-types.ts';

export { DEFAULT_TOPIC, SSEEventTypes };
export { createWorkersRuntime } from './composition-root.ts';
export type {
  TaskRegistryPort,
  WorkersClock,
  WorkersRuntime,
  WorkersRuntimeOptions,
} from './composition-root.ts';
export type {
  ExecutionRecord,
  JobId,
  JobContext,
  JobDefinition,
  JobDispatcherOptions,
  JobHandler,
  JobMessage,
  JobModuleImporter,
  JobResolution,
  JobResolutionSource,
  JobResult,
  RegisterJobInput,
  RegisterTaskInput,
  RuntimeJobKvKeyFactories,
  RuntimeJobStoragePort,
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
