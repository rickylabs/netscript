import { UseCase } from './use-case.ts';
import type { PipelineStep, PipelineStepInspection } from './pipeline-step.ts';

/** Evidence captured after one pipeline step executes. */
export interface PipelineStepEvidence<TOutput> {
  /** Executed step identifier. */
  readonly stepId: string;
  /** Step inspection captured before execution. */
  readonly inspection: PipelineStepInspection;
  /** Step output passed to the next step. */
  readonly output: TOutput;
}

/** Result returned by a pipeline use case. */
export interface PipelineResult<TOutput> {
  /** Final pipeline output. */
  readonly output: TOutput;
  /** Step-by-step execution evidence. */
  readonly steps: readonly PipelineStepEvidence<unknown>[];
}

/**
 * Layer-2 use-case base for ordered, evidence-producing workflows.
 *
 * Demonstrated concretes: deploy upgrade pipeline and scaffold init pipeline.
 */
export abstract class Pipeline<TInput, TOutput> extends UseCase<TInput, PipelineResult<TOutput>> {
  /** Ordered steps owned by the concrete pipeline. */
  protected abstract readonly steps: readonly PipelineStep<unknown, unknown>[];

  /** Adapt the public input into the first step input. Override-allowed. */
  protected initialStepInput(input: TInput): unknown {
    return input;
  }

  /** Adapt the final step output into the public output. Override-allowed. */
  protected finalOutput(output: unknown): TOutput {
    return output as TOutput;
  }

  /** Execute each step in declaration order and capture evidence. */
  override async execute(input: TInput): Promise<PipelineResult<TOutput>> {
    let current = this.initialStepInput(input);
    const evidence: PipelineStepEvidence<unknown>[] = [];

    for (const step of this.steps) {
      const inspection = step.inspect(current);
      const prepared = await step.prepare(current);
      const output = await step.execute(prepared);
      evidence.push({ stepId: step.id, inspection, output });
      current = output;
    }

    return {
      output: this.finalOutput(current),
      steps: evidence,
    };
  }
}
