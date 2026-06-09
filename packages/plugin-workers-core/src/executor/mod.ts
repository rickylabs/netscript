/**
 * @module @netscript/plugin-workers-core/executor
 *
 * Worker task execution contracts and adapters.
 */

export { TaskExecutor } from '../abstracts/task-executor.ts';
export { TaskRuntimeAdapter } from '../abstracts/task-runtime-adapter.ts';
export {
  CmdRuntimeAdapter,
  DaxProcessRunner,
  DenoRuntimeAdapter,
  DotNetRuntimeAdapter,
  ExecutableRuntimeAdapter,
  PowerShellRuntimeAdapter,
  PythonRuntimeAdapter,
  runProcess,
  RuntimeAdapterBase,
  ShellRuntimeAdapter,
} from './adapters/mod.ts';
export type {
  EnvironmentReader,
  ProcessRunInput,
  ProcessRunner,
  RuntimeCommandBuildContext,
  RuntimeCommandSpec,
  RuntimeTaskMetadata,
} from './adapters/mod.ts';
export {
  createDefaultRuntimeAdapterMap,
  createDefaultTaskExecutor,
  MultiRuntimeTaskExecutor,
} from './multi-runtime-task-executor.ts';
export type {
  ResolvedTaskExecutionOptions,
  TaskLogEntry,
  TaskDefinition,
  TaskExecutionOptions,
  TaskInstrumentationLike,
  TaskInstrumentationSpan,
  TaskResult,
  TaskRuntimeAdapterLike,
  TaskType,
  WorkerTaskPermissionField,
  WorkerTaskPermissions,
} from './executor-types.ts';
export type { MultiRuntimeTaskExecutorOptions } from './multi-runtime-task-executor.ts';
