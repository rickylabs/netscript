/**
 * @module @netscript/plugin-workers-core/config
 *
 * Worker job and task configuration schemas.
 */

export type { ConfigSchema, ConfigSchemaResult } from './config-schema.ts';
export { JobConfigSchema, RetentionConfigSchema } from './job-config.ts';
export type {
  JobConfig,
  RetentionConfig,
  WorkerConfigPermissions,
  WorkerConfigPermissionValue,
  WorkerJobSource,
} from './job-config.ts';
export { TaskConfigSchema } from './task-config.ts';
export type { TaskConfig, WorkerTaskSource, WorkerTaskType } from './task-config.ts';
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
  QueueProviderData,
  ScalingConfig,
  ScalingConfigData,
  TopicRetentionConfig,
  TopicRetentionConfigData,
  WorkerGroup,
  WorkerGroupData,
  WorkersConfig,
  WorkersConfigData,
  WorkersConfigInput,
} from './workers-config.ts';
