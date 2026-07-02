/**
 * Canonical token-usage contract.
 *
 * Q1 resolution: the agent loop (E3) emits a **real** usage chunk, so the usage
 * type is defined now rather than deferred. Core fields are always present;
 * detail fields are provider-dependent and optional. Structurally aligned with
 * `@tanstack/ai`'s `TokenUsage` so provider adapters map their SDK usage onto
 * it directly.
 *
 * @module
 */

/** Detailed breakdown of prompt (input) tokens by category. */
export interface PromptTokensDetails {
  /** Tokens served from cache. */
  readonly cachedTokens?: number;
  /** Tokens written to cache. */
  readonly cacheWriteTokens?: number;
  /** Audio input tokens. */
  readonly audioTokens?: number;
  /** Image input tokens. */
  readonly imageTokens?: number;
  /** Text input tokens. */
  readonly textTokens?: number;
  /** Document input tokens (e.g. PDF inputs). */
  readonly documentTokens?: number;
}

/** Detailed breakdown of completion (output) tokens by category. */
export interface CompletionTokensDetails {
  /** Reasoning/thinking tokens. */
  readonly reasoningTokens?: number;
  /** Audio output tokens. */
  readonly audioTokens?: number;
  /** Image output tokens. */
  readonly imageTokens?: number;
  /** Text output tokens. */
  readonly textTokens?: number;
}

/** Provider-reported, normalized cost breakdown for a single request. */
export interface UsageCostBreakdown {
  /** Total cost the gateway paid upstream. */
  readonly upstreamCost?: number;
  /** Upstream cost attributable to input tokens. */
  readonly upstreamInputCost?: number;
  /** Upstream cost attributable to output tokens. */
  readonly upstreamOutputCost?: number;
}

/**
 * Open, serializable bag for provider-specific usage fields not covered by the
 * canonical shape. Constrained to non-nullish values so `Usage` stays
 * assignable across JSON-serialization boundaries.
 */
export type ProviderUsageDetails = Record<string, NonNullable<unknown>>;

/**
 * Canonical token usage for a run.
 *
 * `totalTokens` may exceed `promptTokens + completionTokens` when reasoning,
 * cache, or tool tokens are billed separately.
 */
export interface Usage {
  /** Total input/prompt tokens. */
  readonly promptTokens: number;
  /** Total output/completion tokens. */
  readonly completionTokens: number;
  /** Total tokens as reported by the provider. */
  readonly totalTokens: number;
  /** Per-category prompt token breakdown. */
  readonly promptTokensDetails?: PromptTokensDetails;
  /** Per-category completion token breakdown. */
  readonly completionTokensDetails?: CompletionTokensDetails;
  /** Provider-reported cost for the request, when available. */
  readonly cost?: number;
  /** Provider-reported cost breakdown, when available. */
  readonly costDetails?: UsageCostBreakdown;
  /** Provider-specific usage fields not covered above. */
  readonly providerUsageDetails?: ProviderUsageDetails;
}
