/**
 * Metric domain types and the token cost model.
 *
 * The four scored metrics are `test_pass_rate`, `turns_to_green`, `cost`, and
 * `lines_of_code` (report-only, weight 0). Wall-clock seconds is carried
 * alongside as a normalized-but-separately-weighted signal.
 *
 * @module
 */

import type { TokenUsage } from './agent.ts';

/**
 * Per-model token pricing in USD per 1,000,000 tokens. Cache multipliers follow
 * Anthropic prompt-cache economics: reads ~0.1x base input, writes ~1.25x base
 * input (5-minute TTL). Values are pinned in `bench.config.ts` from the
 * `claude-api` reference; the instrument never fabricates pricing.
 */
export interface ModelPricing {
  /** Model id this pricing applies to. */
  readonly model: string;
  /** USD per 1M base input tokens. */
  readonly inputPerMillion: number;
  /** USD per 1M output tokens. */
  readonly outputPerMillion: number;
  /** Multiplier on input price for cache-read tokens. */
  readonly cacheReadMultiplier: number;
  /** Multiplier on input price for cache-write tokens. */
  readonly cacheWriteMultiplier: number;
}

/** Compute USD cost for a usage record under a given pricing table. */
export function costOf(usage: TokenUsage, pricing: ModelPricing): number {
  const inputRate = pricing.inputPerMillion / 1_000_000;
  const outputRate = pricing.outputPerMillion / 1_000_000;
  return (
    usage.inputTokens * inputRate +
    usage.outputTokens * outputRate +
    usage.cacheReadTokens * inputRate * pricing.cacheReadMultiplier +
    usage.cacheCreationTokens * inputRate * pricing.cacheWriteMultiplier
  );
}

/**
 * The primary metric bundle for one task attempt. `linesOfCode` is captured for
 * reporting only and carries weight 0 in every preset (it is a size signal, not
 * a quality signal).
 */
export interface Metrics {
  /** Best fully-observed pass rate across turns, in [0, 1]. */
  readonly testPassRate: number;
  /**
   * Turn index (1-based count) at which the suite first went fully green, or
   * `null` if it never did within the caps.
   */
  readonly turnsToGreen: number | null;
  /** Total USD cost of the agent run. */
  readonly cost: number;
  /** Wall-clock seconds for the whole attempt. */
  readonly wallSeconds: number;
  /** Net lines of code in the solution (report-only, weight 0). */
  readonly linesOfCode: number;
}
