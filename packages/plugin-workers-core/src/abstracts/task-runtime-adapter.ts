import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskLogEntry,
  TaskResult,
  TaskType,
} from '../executor/executor-types.ts';

export type { ResolvedTaskExecutionOptions, TaskLogEntry } from '../executor/executor-types.ts';

/** Stub-only contract for a single task runtime adapter. */
export abstract class TaskRuntimeAdapter {
  /** Stable adapter identifier. */
  abstract readonly id: string;
  /** Runtime handled by this adapter, or null for custom dispatchers. */
  abstract readonly runtime: TaskType | null;
  /** Return whether this adapter supports a task. */
  abstract supports(task: TaskDefinition): boolean;
  /** Execute a task with already resolved options. */
  abstract execute(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
  ): Promise<TaskResult>;
}
