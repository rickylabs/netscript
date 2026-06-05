/**
 * @module @netscript/plugin-workers-core/runtime
 *
 * Worker runtime composition and runner contracts.
 */

export { createWorkersRuntime } from './composition-root.ts';
export { DEFAULT_TOPIC, JobKvKeys, SSEEventTypes } from '../domain/mod.ts';
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
  JobHandler,
  JobMessage,
  JobResult,
  RegisterJobInput,
  RegisterTaskInput,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
  TaskResult,
} from '../domain/mod.ts';
export { InProcessJobDispatcher } from './job-dispatcher.ts';
export type {
  JobDispatcherOptions,
  JobModuleImporter,
  JobResolution,
  JobResolutionSource,
  StaticJobRegistry,
} from './job-dispatcher.ts';
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
