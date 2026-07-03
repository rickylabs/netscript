/**
 * Agent-interaction domain types: token usage, turns, and the driver request.
 *
 * A "turn" is one assistant message boundary, tool-round inclusive (OQ5): the
 * agent may call tools within a turn, but the turn closes when the assistant
 * yields control. `turns_to_green` counts these boundaries.
 *
 * @module
 */

/**
 * Token accounting for a single turn or an aggregate. Fields mirror the
 * Anthropic usage record so a real Claude Code adapter can populate them
 * verbatim and the cost model can price cache reads/writes distinctly.
 */
export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Tokens written to the prompt cache (billed above base input). */
  readonly cacheCreationTokens: number;
  /** Tokens read from the prompt cache (billed far below base input). */
  readonly cacheReadTokens: number;
}

/** Empty usage constant for accumulation seeds. */
export const ZERO_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
};

/** Add two usage records field-wise. */
export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheCreationTokens: a.cacheCreationTokens + b.cacheCreationTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
  };
}

/** Why the agent stopped a turn (best-effort, adapter-populated). */
export type StopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'refusal' | 'error' | 'unknown';

/**
 * One assistant turn emitted by an {@link AgentDriver}. The driver is
 * responsible for materializing the turn's file edits into the sandbox before
 * yielding, so the runner can run the test suite against the post-turn state.
 */
export interface AgentTurn {
  /** Zero-based turn index in emission order. */
  readonly index: number;
  /** Token usage attributable to this turn. */
  readonly usage: TokenUsage;
  /** Stop reason for the turn, when known. */
  readonly stopReason: StopReason;
  /** Optional free-form assistant text for the trace (never asserted on). */
  readonly text?: string;
}

/** Request handed to an {@link AgentDriver} to solve a task in a sandbox. */
export interface AgentRunRequest {
  /** Model identifier to pin (e.g. `claude-opus-4-8`). */
  readonly model: string;
  /** Agent-facing prompt body (already assembled from the task). */
  readonly prompt: string;
  /** Absolute path to the throwaway sandbox working directory. */
  readonly workdir: string;
  /** Hard cap on assistant turns; the driver must stop at or before this. */
  readonly maxTurns: number;
  /** Hard wall-clock cap in seconds for the whole agent run. */
  readonly maxWallSeconds: number;
}
