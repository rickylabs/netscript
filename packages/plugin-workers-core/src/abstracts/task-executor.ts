import type {
  TaskDefinition,
  TaskExecutionOptions,
  TaskResult,
} from '../executor/executor-types.ts';

/** Execution context shared by worker runtime dispatchers. */
export interface ExecutionContext {
  /** Correlation identifier propagated across execution. */
  readonly correlationId?: string;
  /** Cancellation signal for execution. */
  readonly signal?: AbortSignal;
}

/** Stub-only contract for the workers task orchestrator. */
export abstract class TaskExecutor {
  /** Stable executor identifier. */
  abstract readonly id: string;
  /** Return whether this executor can run a task. */
  abstract supports(task: TaskDefinition): boolean;
  /** Execute a task and return its result. */
  abstract execute(
    task: TaskDefinition,
    options?: TaskExecutionOptions,
  ): Promise<TaskResult>;
}
