import type { TaskDefinition, TaskExecutionOptions, TaskResult, TaskType } from '../domain/mod.ts';

/** Log entry emitted while a task subprocess is running. */
export interface TaskLogEntry {
  readonly message: string;
  readonly severity: 'debug' | 'error' | 'info' | 'warn';
  readonly source: 'stderr' | 'stdout';
  readonly taskId: string;
  readonly timestamp: Date;
}
/** Execution options resolved by the task orchestrator before adapter dispatch. */
export interface ResolvedTaskExecutionOptions
  extends
    Required<Pick<TaskExecutionOptions, 'cwd' | 'env' | 'timeout'>>,
    Readonly<Omit<TaskExecutionOptions, 'args' | 'cwd' | 'env' | 'timeout'>> {
  readonly args: readonly string[];
  readonly onLog?: {
    (entry: TaskLogEntry): void;
  };
}
/** Stub-only contract for a single task runtime adapter. */
export abstract class TaskRuntimeAdapter {
  abstract readonly id: string;
  abstract readonly runtime: TaskType | null;
  abstract supports(task: TaskDefinition): boolean;
  abstract execute(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
  ): Promise<TaskResult>;
}
