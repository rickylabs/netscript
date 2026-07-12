import type {
  WorkflowDefinition as DomainWorkflowDefinition,
  WorkflowId as DomainWorkflowId,
  WorkflowStep as DomainWorkflowStep,
} from '../domain/mod.ts';
import type { JobId, TaskId, WorkflowDefinition } from './builder-types.ts';

/** Workflow builder state used to gate `build()`. */
export type WorkflowBuilderState = 'initial' | 'step-set';

/** Options for adding a job-backed workflow step. */
export type WorkflowJobStepOptions<TPayload = unknown> = Readonly<{
  jobId: JobId;
  payload?: TPayload;
}>;

/** Options for adding a task-backed workflow step. */
export type WorkflowTaskStepOptions<TPayload = unknown> = Readonly<{
  taskId: TaskId;
  payload?: TPayload;
}>;

/** Typestate builder interface for workflow definitions. */
export interface WorkflowBuilder<
  TId extends string,
  TConfigured extends WorkflowBuilderState,
  TPayload,
  TResult,
> {
  /** Narrow the payload type carried by this workflow definition. */
  payload<TNextPayload>(): WorkflowBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Add a job-backed workflow step. */
  jobStep(
    id: string,
    options: WorkflowJobStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  /** Add a task-backed workflow step. */
  taskStep(
    id: string,
    options: WorkflowTaskStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  /** Add a sleep step. */
  sleep(id: string, durationMs: number): WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  /** Add tags to this workflow definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this workflow definition. */
  metadata(data: Record<string, unknown>): this;
  /** Set the workflow timeout in milliseconds. */
  timeout(ms: number): this;
  /** Build the workflow definition after at least one step has been configured. */
  build(
    this: TConfigured extends 'step-set' ? WorkflowBuilder<TId, TConfigured, TPayload, TResult>
      : never,
  ): WorkflowDefinition<TId>;
}

type WorkflowBuilderData<TId extends string> = Readonly<{
  id: TId;
  steps: readonly DomainWorkflowStep[];
  metadata: Readonly<Record<string, unknown>>;
  tags: readonly string[];
  timeout?: number;
}>;

class WorkflowBuilderImpl<
  TId extends string,
  TConfigured extends WorkflowBuilderState,
  TPayload,
  TResult,
> {
  readonly #data: WorkflowBuilderData<TId>;

  constructor(data: WorkflowBuilderData<TId>) {
    this.#data = data;
  }

  payload<TNextPayload>(): WorkflowBuilder<TId, TConfigured, TNextPayload, TResult> {
    return new WorkflowBuilderImpl<TId, TConfigured, TNextPayload, TResult>(this.#data);
  }

  jobStep(
    id: string,
    options: WorkflowJobStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    return new WorkflowBuilderImpl<TId, 'step-set', TPayload, TResult>({
      ...this.#data,
      steps: [
        ...this.#data.steps,
        { id, jobId: options.jobId, kind: 'job', payload: options.payload },
      ],
    });
  }

  taskStep(
    id: string,
    options: WorkflowTaskStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    return new WorkflowBuilderImpl<TId, 'step-set', TPayload, TResult>({
      ...this.#data,
      steps: [
        ...this.#data.steps,
        { id, kind: 'task', payload: options.payload, taskId: options.taskId },
      ],
    });
  }

  sleep(id: string, durationMs: number): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    return new WorkflowBuilderImpl<TId, 'step-set', TPayload, TResult>({
      ...this.#data,
      steps: [...this.#data.steps, { durationMs, id, kind: 'sleep' }],
    });
  }

  tags(...tags: string[]): WorkflowBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new WorkflowBuilderImpl({
      ...this.#data,
      tags: [...new Set([...this.#data.tags, ...tags])],
    });
  }

  metadata(
    data: Record<string, unknown>,
  ): WorkflowBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new WorkflowBuilderImpl({
      ...this.#data,
      metadata: { ...this.#data.metadata, ...data },
    });
  }

  timeout(ms: number): WorkflowBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new WorkflowBuilderImpl({ ...this.#data, timeout: ms });
  }

  build(
    this: TConfigured extends 'step-set' ? WorkflowBuilderImpl<TId, TConfigured, TPayload, TResult>
      : never,
  ): WorkflowDefinition<TId> {
    if (this.#data.steps.length === 0) {
      throw new Error(`Workflow "${this.#data.id}" requires at least one step before build().`);
    }

    const definition: DomainWorkflowDefinition<TId> = Object.freeze({
      id: this.#data.id as DomainWorkflowId<TId>,
      metadata: Object.keys(this.#data.metadata).length > 0
        ? Object.freeze({ ...this.#data.metadata })
        : undefined,
      steps: this.#data.steps,
      tags: this.#data.tags.length > 0 ? Object.freeze([...this.#data.tags]) : undefined,
      timeout: this.#data.timeout,
    });

    return definition;
  }
}

/** Start a worker workflow definition chain. */
export function defineWorkflow<TId extends string>(
  id: TId,
): WorkflowBuilder<TId, 'initial', unknown, unknown> {
  return new WorkflowBuilderImpl<TId, 'initial', unknown, unknown>({
    id,
    metadata: {},
    steps: [],
    tags: [],
  });
}
