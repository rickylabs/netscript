/**
 * @module @netscript/plugin-workers-core
 *
 * Job, task, workflow, runtime, configuration, and testing primitives for
 * NetScript workers plugins.
 *
 * @example Define a worker job
 * ```ts
 * import { defineJob } from "@netscript/plugin-workers-core";
 * import { z } from "zod";
 *
 * const job = defineJob("send-email")
 *   .payload(z.object({ to: z.string().email() }))
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
export { createJobTools } from './src/telemetry/job-tools.ts';
export { startWorkers } from './src/public/root.ts';
export { inspectJob, inspectTask, inspectWorkflow } from './src/public/root.ts';
export type { JobId, TaskId } from './src/public/root.ts';
export type { CronHelpers, PermissionPresets } from './src/public/root.ts';
export type {
  WorkerIdempotencyClaim,
  WorkerIdempotencyInput,
  WorkerIdempotencyPort,
  WorkerIdempotencySource,
} from './src/public/root.ts';
export type { JobTools, JobToolSpan } from './src/telemetry/job-tools.ts';
export type {
  JobBuilder,
  JobDefinition,
  JobHandler,
  JobHandlerContext,
  JobHandlerDefinition,
  JobPayloadMap,
  JobPayloadOf,
  JobPayloadSchema,
  JobResult,
  PublicStandardSchema,
  TaskBuilder,
  TaskDefinition,
  WorkflowBuilder,
  WorkflowDefinition,
} from './src/public/root.ts';
