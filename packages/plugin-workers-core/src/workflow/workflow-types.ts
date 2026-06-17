export type {
  JobId,
  TaskId,
  WorkflowDefinition,
  WorkflowId,
  WorkflowStep,
} from '../builders/builder-types.ts';

/** Workflow execution lifecycle status. */
export type WorkflowExecutionStatus = 'cancelled' | 'completed' | 'failed' | 'pending' | 'running';

/** Workflow step lifecycle status. */
export type WorkflowStepStatus = 'completed' | 'failed' | 'pending' | 'running' | 'skipped';

/** Workflow step kind. */
export type WorkflowStepKind = 'job' | 'sleep' | 'task';

/** Result produced by a workflow step. */
export type WorkflowStepResult<TResult = unknown> = Readonly<{
  readonly stepId: string;
  readonly status: WorkflowStepStatus;
  readonly output?: TResult;
  readonly error?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly duration?: number;
}>;

/** Map of workflow step results by step id. */
export type WorkflowResults = Readonly<Record<string, WorkflowStepResult>>;

/** Durable workflow execution state. */
export type WorkflowState<TPayload = unknown> = Readonly<{
  readonly workflowId: string;
  readonly executionId: string;
  readonly status: WorkflowExecutionStatus;
  readonly currentStepIndex: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly duration?: number;
  readonly error?: string;
  readonly payload?: TPayload;
  readonly results: WorkflowResults;
  readonly triggeredBy: string;
}>;

/** Event routed to a workflow execution. */
export type WorkflowEvent<TPayload = unknown> = Readonly<{
  readonly workflowId: string;
  readonly executionId: string;
  readonly eventName: string;
  readonly payload?: TPayload;
  readonly createdAt: string;
}>;

/** Options supplied when starting a workflow execution. */
export type WorkflowExecutionOptions<TPayload = unknown> = Readonly<{
  readonly executionId?: string;
  readonly payload?: TPayload;
  readonly triggeredBy?: 'manual' | 'schedule' | 'event' | 'api';
}>;
