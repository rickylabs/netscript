/**
 * @module @netscript/plugin-workers-core/abstracts
 *
 * Stub-only abstract contracts for workers extension points.
 */

export { JobDispatcher } from './job-dispatcher.ts';
export { JobLifecycleAdapter } from './job-lifecycle-adapter.ts';
export { JobScheduler } from './job-scheduler.ts';
export { Registry } from './registry.ts';
export { TaskInstrumentation } from './task-instrumentation.ts';
export { TaskExecutor } from './task-executor.ts';
export { TaskRuntimeAdapter } from './task-runtime-adapter.ts';
export { WorkerInstrumentation } from './worker-instrumentation.ts';
export { CliCommand, WorkersCommand } from './workers-command.ts';
export { WorkersItemScaffolder } from './workers-item-scaffolder.ts';
export type { DisposeContext, InitContext } from './job-lifecycle-adapter.ts';
export type { DispatchContext } from './job-scheduler.ts';
export type { ExecutionContext } from './task-executor.ts';
export type {
  ResolvedTaskExecutionOptions,
  RuntimeTaskMetadata,
  TaskDefinition,
  TaskExecutionOptions,
  TaskLogEntry,
  TaskResult,
  TaskType,
  WorkerTaskPermissionField,
  WorkerTaskPermissions,
} from '../executor/executor-types.ts';
export type { JobContext, JobDefinition, JobHandler, JobResult } from '../runtime/runtime-types.ts';
export type {
  WorkerInstrumentationContext,
  WorkerInstrumentationSpan,
} from './worker-instrumentation.ts';
export type { WorkersCommandDefinition } from './workers-command.ts';
