/** Summary emitted by a pipeline step for dry-run and diagnostics. */
export interface PipelineStepInspection {
  /** Stable step identifier. */
  readonly id: string;
  /** Human-readable step label. */
  readonly label: string;
  /** Optional files, services, or resources the step expects to touch. */
  readonly touches?: readonly string[];
}

/**
 * Layer-2 contract for one operation inside a multi-step pipeline.
 *
 * Demonstrated concretes: deploy build/copy/install/start/stop steps and scaffold
 * workspace/template/git steps.
 */
export abstract class PipelineStep<TInput, TOutput> {
  /** Stable step identifier used in evidence and diagnostics. */
  abstract readonly id: string;

  /** Inspect the step without performing side effects. */
  abstract inspect(input: TInput): PipelineStepInspection;

  /** Prepare validated step input. */
  abstract prepare(input: TInput): Promise<TInput> | TInput;

  /** Execute the step. */
  abstract execute(input: TInput): Promise<TOutput> | TOutput;
}
