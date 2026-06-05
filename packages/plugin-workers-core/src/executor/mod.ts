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
  ShellRuntimeAdapter,
} from './adapters/mod.ts';
export type {
  ProcessRunInput,
  ProcessRunner,
  RuntimeCommandBuildContext,
  RuntimeCommandSpec,
} from './adapters/mod.ts';
export {
  createDefaultRuntimeAdapterMap,
  createDefaultTaskExecutor,
  MultiRuntimeTaskExecutor,
} from './multi-runtime-task-executor.ts';
export type {
  ResolvedTaskExecutionOptions,
  TaskLogEntry,
} from '../abstracts/task-runtime-adapter.ts';
export type { MultiRuntimeTaskExecutorOptions } from './multi-runtime-task-executor.ts';
