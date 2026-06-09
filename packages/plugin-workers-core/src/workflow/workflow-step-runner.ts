import type { WorkflowState, WorkflowStep, WorkflowStepResult } from './workflow-types.ts';

/** Function that executes a job-backed workflow step. */
export type WorkflowJobStepRunner = (
  step: WorkflowStep,
  state: WorkflowState,
) => Promise<unknown>;

/** Function that executes a task-backed workflow step. */
export type WorkflowTaskStepRunner = (
  step: WorkflowStep,
  state: WorkflowState,
) => Promise<unknown>;

/** Options for executing workflow steps. */
export type WorkflowStepRunnerOptions = Readonly<{
  runJobStep?: WorkflowJobStepRunner;
  runTaskStep?: WorkflowTaskStepRunner;
  sleep?: (durationMs: number) => Promise<void>;
  now?: () => Date;
}>;

/** Executes individual workflow steps through explicit runtime callbacks. */
export class WorkflowStepRunner {
  readonly #runJobStep?: WorkflowJobStepRunner;
  readonly #runTaskStep?: WorkflowTaskStepRunner;
  readonly #sleep: (durationMs: number) => Promise<void>;
  readonly #now: () => Date;

  constructor(options: WorkflowStepRunnerOptions = {}) {
    this.#runJobStep = options.runJobStep;
    this.#runTaskStep = options.runTaskStep;
    this.#sleep = options.sleep ??
      ((durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)));
    this.#now = options.now ?? (() => new Date());
  }

  async run(step: WorkflowStep, state: WorkflowState): Promise<WorkflowStepResult> {
    const startedAt = this.#now().getTime();

    try {
      const output = await this.runByKind(step, state);
      return Object.freeze({
        completedAt: this.#now().toISOString(),
        duration: this.#now().getTime() - startedAt,
        output,
        status: 'completed',
        stepId: step.id,
      });
    } catch (error) {
      return Object.freeze({
        completedAt: this.#now().toISOString(),
        duration: this.#now().getTime() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        status: 'failed',
        stepId: step.id,
      });
    }
  }

  private async runByKind(step: WorkflowStep, state: WorkflowState): Promise<unknown> {
    if (step.kind === 'sleep') {
      await this.#sleep(step.durationMs ?? 0);
      return undefined;
    }

    if (step.kind === 'job') {
      if (!this.#runJobStep) {
        throw new Error(`Workflow step ${step.id} requires a job step runner.`);
      }
      return this.#runJobStep(step, state);
    }

    if (!this.#runTaskStep) {
      throw new Error(`Workflow step ${step.id} requires a task step runner.`);
    }
    return this.#runTaskStep(step, state);
  }
}
