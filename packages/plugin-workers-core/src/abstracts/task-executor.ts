import type { TaskDefinition, TaskExecutionOptions, TaskResult } from '../domain/mod.ts';

/** Execution context shared by worker runtime dispatchers. */
export interface ExecutionContext {
  readonly correlationId?: string;
  readonly signal?: AbortSignal;
}

/** Stub-only contract for the workers task orchestrator. */
export abstract class TaskExecutor {
  abstract readonly id: string;
  abstract supports(task: TaskDefinition): boolean;
  abstract execute(
    task: TaskDefinition,
    options?: TaskExecutionOptions,
  ): Promise<TaskResult>;
}
