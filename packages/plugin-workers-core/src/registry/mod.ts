/**
 * @module @netscript/plugin-workers-core/registry
 *
 * Worker registry contracts and implementations.
 */

export { KvJobRegistry } from './kv-job-registry.ts';
export { KvTaskRegistry } from './kv-task-registry.ts';
export { MemoryJobRegistry } from './memory-job-registry.ts';
export { Registry } from './registry.ts';
export type { JobFilterOptions } from './kv-job-registry.ts';
export type { TaskFilterOptions } from './kv-task-registry.ts';
export type {
  ExecutionRecord,
  JobDefinition,
  JobSource,
  RegisterJobInput,
  RegisterTaskInput,
  RegistryJobStoragePort,
  RuntimePermissions,
  RuntimePermissionValue,
  TaskDefinition,
  TaskExecutionType,
  TaskSource,
} from './registry-types.ts';
export type {
  KvEntry,
  KvListSelector,
  RegistryKvStore,
  RegistryOptions,
} from './registry-options.ts';
