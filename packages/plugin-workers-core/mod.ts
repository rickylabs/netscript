/**
 * @module @netscript/plugin-workers-core
 *
 * Job, task, workflow, runtime, configuration, and testing primitives for
 * NetScript workers plugins.
 *
 * @example Define a worker job
 * ```ts
 * import { defineJob } from "@netscript/plugin-workers-core";
 *
 * const job = defineJob("send-email")
 *   .entrypoint("./workers/jobs/send-email.ts")
 *   .build();
 * ```
 */

export { defineJob } from './src/public/root.ts';
export { defineTask } from './src/public/root.ts';
export { defineWorkflow } from './src/public/root.ts';
export { cron, permissions } from './src/public/root.ts';
export { defineJobHandler } from './src/public/root.ts';
export { createWorkersRuntime } from './src/public/root.ts';
export { createFailureResult, createSuccessResult } from './src/public/root.ts';
export { startWorkers } from './src/public/root.ts';
export { inspectJob, inspectTask, inspectWorkflow } from './src/public/root.ts';
export type { JobId, TaskId } from './src/public/root.ts';
export type { CronHelpers, PermissionPresets } from './src/public/root.ts';
export type {
  JobBuilder,
  JobDefinition,
  JobHandlerContext,
  JobResult,
  TaskBuilder,
  TaskDefinition,
  WorkflowBuilder,
  WorkflowDefinition,
} from './src/public/root.ts';
