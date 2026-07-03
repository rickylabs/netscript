/**
 * Agent-loop error types.
 *
 * @module
 */

import { AiError } from '../contracts/errors.ts';

/**
 * Raised when an agent-loop run reaches its `maxSteps` bound without the model
 * producing a final (tool-call-free) answer. The run settles in the `errored`
 * terminal state and the loop yields an `error` chunk carrying this error
 * before its final `done` chunk.
 */
export class AgentMaxStepsExceededError extends AiError {
  /** The step bound that was reached. */
  readonly maxSteps: number;

  /** Construct the error for the exceeded `maxSteps` bound. */
  constructor(maxSteps: number) {
    super(
      `Agent loop exceeded its maximum of ${maxSteps} step(s) without a final answer.`,
    );
    this.name = 'AgentMaxStepsExceededError';
    this.maxSteps = maxSteps;
  }
}
