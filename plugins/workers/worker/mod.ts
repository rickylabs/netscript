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
  JobResult,
  RuntimePermissions,
  RuntimePermissionValue,
  StaticJobRegistry,
  TaskDefinition,
  TaskExecutionOptions,
} from '@netscript/plugin-workers-core/runtime';
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
export { KvWorkerIdempotencyStore } from './worker-idempotency-store.ts';
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
export type {
  KvWorkerIdempotencyStoreOptions,
  WorkerIdempotencyKvStore,
} from './worker-idempotency-store.ts';
export type { WorkerPoolOptions } from './job-runner-pool.ts';
