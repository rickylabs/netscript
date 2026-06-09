/**
 * @module @netscript/plugin-workers-core/presets
 *
 * Worker runtime presets.
 */

export { startWorkers } from './start-workers.ts';
export type { StartWorkersOptions } from './start-workers.ts';
export type {
  ExecutionRecord,
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
