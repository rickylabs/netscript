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
  build(): TConfigured extends 'step-set' ? WorkflowDefinition<TId> : never;
}

class WorkflowBuilderImpl<
  TId extends string,
  TConfigured extends WorkflowBuilderState,
  TPayload,
  TResult,
> implements WorkflowBuilder<TId, TConfigured, TPayload, TResult> {
  readonly #id: TId;
  #steps: DomainWorkflowStep[] = [];
  #metadata: Record<string, unknown> = {};
  #tags: string[] = [];
  #timeout?: number;

  constructor(id: TId) {
    this.#id = id;
  }

  payload<TNextPayload>(): WorkflowBuilder<TId, TConfigured, TNextPayload, TResult> {
    return this as unknown as WorkflowBuilder<TId, TConfigured, TNextPayload, TResult>;
  }

  jobStep(
    id: string,
    options: WorkflowJobStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    this.#steps.push({ id, jobId: options.jobId, kind: 'job', payload: options.payload });
    return this as unknown as WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  }

  taskStep(
    id: string,
    options: WorkflowTaskStepOptions<TPayload>,
  ): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    this.#steps.push({ id, kind: 'task', payload: options.payload, taskId: options.taskId });
    return this as unknown as WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  }

  sleep(id: string, durationMs: number): WorkflowBuilder<TId, 'step-set', TPayload, TResult> {
    this.#steps.push({ durationMs, id, kind: 'sleep' });
    return this as unknown as WorkflowBuilder<TId, 'step-set', TPayload, TResult>;
  }

  tags(...tags: string[]): this {
    this.#tags = [...new Set([...this.#tags, ...tags])];
    return this;
  }

  metadata(data: Record<string, unknown>): this {
    this.#metadata = { ...this.#metadata, ...data };
    return this;
  }

  timeout(ms: number): this {
    this.#timeout = ms;
    return this;
  }

  build(): TConfigured extends 'step-set' ? WorkflowDefinition<TId> : never {
    if (this.#steps.length === 0) {
      throw new Error(`Workflow "${this.#id}" requires at least one step before build().`);
    }

    const definition: DomainWorkflowDefinition<TId> = Object.freeze({
      id: this.#id as DomainWorkflowId<TId>,
      metadata: Object.keys(this.#metadata).length > 0
        ? Object.freeze({ ...this.#metadata })
        : undefined,
      steps: this.#steps,
      tags: this.#tags.length > 0 ? Object.freeze([...this.#tags]) : undefined,
      timeout: this.#timeout,
    });

    return definition as TConfigured extends 'step-set' ? WorkflowDefinition<TId> : never;
  }
}

/** Start a worker workflow definition chain. */
export function defineWorkflow<TId extends string>(
  id: TId,
): WorkflowBuilder<TId, 'initial', unknown, unknown> {
  return new WorkflowBuilderImpl<TId, 'initial', unknown, unknown>(id);
}
