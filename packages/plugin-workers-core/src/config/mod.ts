/**
 * @module @netscript/plugin-workers-core/config
 *
 * Worker job and task configuration schemas.
 */

export { JobConfigSchema, RetentionConfigSchema } from './job-config.ts';
export type { JobConfig, RetentionConfig } from './job-config.ts';
export { TaskConfigSchema } from './task-config.ts';
export type { TaskConfig } from './task-config.ts';
export {
  defineJobs,
  defineWorkers,
  QueueProviderSchema,
  ScalingConfigSchema,
  TopicRetentionConfigSchema,
  WorkerGroupSchema,
  WorkersConfigSchema,
} from './workers-config.ts';
export type {
  JobConfigInput,
  QueueProvider,
  ScalingConfig,
  TopicRetentionConfig,
  WorkerGroup,
  WorkersConfig,
  WorkersConfigInput,
} from './workers-config.ts';
