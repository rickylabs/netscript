/**
 * Workers Plugin - Worker Module
 *
 * Exports the Scheduler and Worker implementations that use workers primitives.
 *
 * @module
 */

// ============================================================================
// SCHEDULER
// ============================================================================

export { type ScheduledJobInfo, Scheduler, type SchedulerOptions } from './scheduler.ts';
export type {
  JobContext,
  JobDefinition,
  JobHandler,
  JobMessage,
  JobResult,
  RuntimePermissions,
  RuntimePermissionValue,
  StaticJobRegistry,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
} from '@netscript/plugin-workers-core/runtime';
export type {
  DeadLetterReason,
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  NackOptions,
} from '@netscript/queue';
export type {
  WorkerCronJob,
  WorkerCronScheduler,
  WorkerSchedulerExecutionState,
  WorkerSchedulerJobRegistry,
} from './scheduler.ts';

// ============================================================================
// WORKER
// ============================================================================

export { Worker } from './worker.ts';
export type {
  QueueTriggerConfig,
  WorkerCompleteExecutionOptions,
  WorkerCreateExecutionOptions,
  WorkerExecutionRecord,
  WorkerExecutionState,
  WorkerHealthStatus,
  WorkerJobRegistry,
  WorkerOptions,
  WorkerPayloadSchema,
  WorkerTaskExecutor,
  WorkerTaskRegistry,
  WorkerTaskResult,
} from './worker.ts';
export type { WorkerPoolOptions } from './job-runner-pool.ts';

export type {
  ChildFatalError,
  ChildHealthMonitor,
  ChildHealthSnapshot,
  ChildHealthState,
} from '@netscript/plugin/health';
