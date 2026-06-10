import type {
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowExecutionOptions,
  WorkflowState,
  WorkflowStepResult,
} from './workflow-types.ts';
import {
  MemoryWorkflowStateStore,
  type WorkflowClock,
  type WorkflowStateStore,
} from './workflow-state.ts';
import { WorkflowStepRunner, type WorkflowStepRunnerOptions } from './workflow-step-runner.ts';

/** Options for creating a workflow executor. */
export type WorkflowExecutorOptions =
  & WorkflowStepRunnerOptions
  & Readonly<{
    /** Clock used to timestamp workflow state transitions. */
    clock?: WorkflowClock;
    /** Store used to persist workflow state and pending events. */
    stateStore?: WorkflowStateStore;
  }>;

/** Executes workflow definitions as explicit durable state machines. */
export class WorkflowExecutor {
  readonly #clock: WorkflowClock;
  readonly #stateStore: WorkflowStateStore;
  readonly #stepRunner: WorkflowStepRunner;
  readonly #activeExecutions = new Set<string>();

  /** Creates a workflow executor backed by the provided state store and callbacks. */
  constructor(options: WorkflowExecutorOptions = {}) {
    this.#clock = options.clock ?? Object.freeze({ now: () => new Date() });
    this.#stateStore = options.stateStore ?? new MemoryWorkflowStateStore();
    this.#stepRunner = new WorkflowStepRunner({
      now: () => this.#clock.now(),
      runJobStep: options.runJobStep,
      runTaskStep: options.runTaskStep,
      sleep: options.sleep,
    });
  }

  /** Starts or continues a workflow execution with optional initial payload. */
  async execute<TId extends string, TPayload = unknown>(
    workflow: WorkflowDefinition<TId>,
    options: WorkflowExecutionOptions<TPayload> = {},
  ): Promise<WorkflowState<TPayload>> {
    const executionId = options.executionId ?? crypto.randomUUID();
    const existing = await this.#stateStore.findState(workflow.id, executionId);
    const state = existing ?? this.createInitialState(workflow, executionId, options);
    return this.run(workflow, state as WorkflowState<TPayload>);
  }

  /** Resumes a persisted workflow execution by id. */
  async resume<TId extends string>(
    workflow: WorkflowDefinition<TId>,
    executionId: string,
  ): Promise<WorkflowState> {
    const state = await this.#stateStore.findState(workflow.id, executionId);
    if (!state) {
      throw new Error(`Workflow execution ${executionId} was not found.`);
    }
    return this.run(workflow, state);
  }

  /** Stores an event for a workflow step that is waiting on external input. */
  async sendEvent<T = unknown>(event: WorkflowEvent<T>): Promise<void> {
    await this.#stateStore.saveEvent(event);
  }

  /** Reads persisted workflow state without mutating the execution. */
  getState(workflowId: string, executionId: string): Promise<WorkflowState | undefined> {
    return this.#stateStore.findState(workflowId, executionId);
  }

  /** Runs a workflow from its current state until completion or failure. */
  private async run<TId extends string, TPayload>(
    workflow: WorkflowDefinition<TId>,
    initialState: WorkflowState<TPayload>,
  ): Promise<WorkflowState<TPayload>> {
    let state = this.withStatus(initialState, 'running');
    this.#activeExecutions.add(state.executionId);
    await this.#stateStore.saveState(state);

    try {
      for (let index = state.currentStepIndex; index < workflow.steps.length; index++) {
        const step = workflow.steps[index];
        const stepResult = await this.#stepRunner.run(step, state);
        state = this.withStepResult(state, index, stepResult);
        await this.#stateStore.saveState(state);

        if (stepResult.status === 'failed') {
          return this.complete(state, 'failed', stepResult.error);
        }
      }

      return this.complete(state, 'completed');
    } finally {
      this.#activeExecutions.delete(state.executionId);
    }
  }

  /** Creates the first persisted state for a workflow execution. */
  private createInitialState<TId extends string, TPayload>(
    workflow: WorkflowDefinition<TId>,
    executionId: string,
    options: WorkflowExecutionOptions<TPayload>,
  ): WorkflowState<TPayload> {
    return Object.freeze({
      currentStepIndex: 0,
      executionId,
      payload: options.payload,
      results: {},
      startedAt: this.#clock.now().toISOString(),
      status: 'pending',
      triggeredBy: options.triggeredBy ?? 'manual',
      workflowId: workflow.id,
    });
  }

  /** Returns a copy of state with a new lifecycle status. */
  private withStatus<TPayload>(
    state: WorkflowState<TPayload>,
    status: WorkflowState['status'],
  ): WorkflowState<TPayload> {
    return Object.freeze({ ...state, status });
  }

  /** Records a step result and advances the current step cursor. */
  private withStepResult<TPayload>(
    state: WorkflowState<TPayload>,
    currentStepIndex: number,
    result: WorkflowStepResult,
  ): WorkflowState<TPayload> {
    return Object.freeze({
      ...state,
      currentStepIndex: currentStepIndex + 1,
      results: Object.freeze({ ...state.results, [result.stepId]: result }),
    });
  }

  /** Persists the terminal state for a workflow execution. */
  private async complete<TPayload>(
    state: WorkflowState<TPayload>,
    status: 'completed' | 'failed',
    error?: string,
  ): Promise<WorkflowState<TPayload>> {
    const completedAt = this.#clock.now().toISOString();
    const next = Object.freeze({
      ...state,
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(state.startedAt).getTime(),
      error,
      status,
    });
    await this.#stateStore.saveState(next);
    return next;
  }
}
