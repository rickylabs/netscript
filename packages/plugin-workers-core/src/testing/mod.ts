/**
 * @module @netscript/plugin-workers-core/testing
 *
 * Worker testing fixtures and in-memory adapters.
 */

export {};
export {
  createExecutionRecordFixture,
  createJobFixture,
  createJobResultFixture,
  createTestWorkersRuntime,
} from './job-fixtures.ts';
export type {
  ExecutionRecordFixtureOptions,
  JobFixtureDefinition,
  JobFixtureOptions,
  TestWorkersRuntime,
  TestWorkersRuntimeOptions,
} from './job-fixtures.ts';
export { MemoryJobRegistry, MemoryJobStorage } from './memory-job-storage.ts';
export { MemoryWorker } from './memory-worker.ts';
export type { MemoryWorkerDispatch, MemoryWorkerOptions } from './memory-worker.ts';
export type {
  ExecutionRecord,
  JobDefinition as RegistryJobDefinition,
  JobSource as RegistryJobSource,
  RegisterJobInput as RegistryRegisterJobInput,
  Registry,
  RegistryJobStoragePort,
} from '../registry/mod.ts';
export type {
  ExecutionRecord as RuntimeExecutionRecord,
  JobContext,
  JobDefinition,
  JobHandler,
  JobMessage,
  JobResult,
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
  TaskRegistryPort,
  TaskResult,
  WorkersClock,
  WorkersRuntime,
  WorkersRuntimeOptions,
  WorkflowId,
} from '../runtime/mod.ts';
