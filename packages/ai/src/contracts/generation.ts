/**
 * Provider-neutral per-turn generation options.
 *
 * {@linkcode GenerationOptions} is the **owned** vocabulary a caller uses to tune
 * a single model turn — reasoning effort, an output-token cap, and an open
 * provider-options escape hatch — without naming any provider SDK type. The
 * agent loop threads it from {@linkcode import('../ports/agent-loop.ts').AgentLoopInput}
 * into the {@linkcode import('../ports/chat-client.ts').ChatClientRequest}, and each
 * E2 provider adapter maps it to that provider's native request shape
 * (Anthropic `thinking`/`output_config.effort`, OpenAI `reasoning_effort`,
 * OpenRouter `reasoning:{effort}`; Ollama has no reasoning wire and treats
 * `reasoningEffort` as a no-op).
 *
 * Every field is optional and additive: omitting `GenerationOptions` entirely
 * leaves existing adapter call sites unchanged.
 *
 * @module
 */

/**
 * Reasoning effort level, normalized across providers.
 *
 * `'off'` explicitly disables reasoning/extended-thinking (adapters that can
 * turn it off do so; the rest emit nothing). `'low' | 'medium' | 'high'` map to
 * each provider's native effort tier. When unset, the provider's own default
 * applies.
 */
export type ReasoningEffort = 'off' | 'low' | 'medium' | 'high';

/**
 * Per-turn generation options threaded provider-neutrally through the chat seam.
 *
 * @example Per-message effort picker (eis-chat-shaped)
 * ```ts
 * import type { GenerationOptions, ReasoningEffort } from '@netscript/ai/contracts';
 *
 * const perMessage = (effort: ReasoningEffort): GenerationOptions => ({
 *   reasoningEffort: effort,
 *   maxOutputTokens: 2_048,
 * });
 * ```
 */
export interface GenerationOptions {
  /**
   * Reasoning/extended-thinking effort for this turn. Adapters map it natively;
   * providers without a reasoning wire (Ollama) treat it as a no-op.
   */
  readonly reasoningEffort?: ReasoningEffort;
  /**
   * Upper bound on output tokens for this turn, mapped to each provider's native
   * max-output field (Anthropic/OpenAI-compatible/OpenRouter `max_tokens`).
   */
  readonly maxOutputTokens?: number;
  /**
   * Open, provider-specific request-body options merged verbatim into the
   * adapter's `modelOptions` after the normalized fields. Escape hatch for wire
   * keys the neutral surface does not model; keys here override the normalized
   * mapping. Values are provider-defined and pass through untouched.
   */
  readonly providerOptions?: Readonly<Record<string, unknown>>;
}
