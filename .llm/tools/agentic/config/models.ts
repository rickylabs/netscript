/**
 * Central, typed, single-source model identifiers for the agentic suite.
 *
 * MONTHLY MAINTENANCE: change a model id HERE. Two authorities consume these
 * constants and remain the ONLY places that bind a model to a purpose:
 *  - `runtime/routing-policy.ts` `CANONICAL_ROUTE_POLICY` — the lane → agent →
 *    model → effort bindings rendered by `.llm/harness/workflow/lane-policy.md`.
 *    That array is the single source for *routing*; this module is the single
 *    source for the *model-id strings* it (and the presets below) reference.
 *  - `runtime/provider-profiles.ts` `OPENROUTER_PRESETS` — caller-selected
 *    OpenRouter presets, whose model ids come from `OPENROUTER_MODEL_IDS`.
 *
 * There is no other hardcoded model-id literal under `.llm/tools/agentic/**`
 * (enforced by `config/no-hardcoded-volatile_test.ts`).
 */

/** First-party (native provider) model ids used by the canonical route policy. */
export const MODEL_IDS = {
  /** OpenAI/Codex balanced default. */
  codexSol: 'gpt-5.6-sol',
  /** OpenAI/Codex fast-iteration model. */
  codexLuna: 'gpt-5.6-luna',
  /** Anthropic/Claude most-capable model. */
  fable: 'fable-5',
  /** Anthropic/Claude documentation/workflow model. */
  opus: 'opus-4.8',
  /** Google/Antigravity CLI identifier. */
  antigravity: 'agy',
} as const;

/**
 * Native-provider model ids in the CLI-argument spelling the rollout canary
 * passes to `provider-canary` (`claude`/`codex` `--model` args). These use the
 * provider CLIs' own dashed spelling, distinct from the routing ids in
 * `MODEL_IDS` (e.g. `claude-opus-4-8` vs the routing id `opus-4.8`).
 */
export const NATIVE_CANARY_MODEL_ARGS = {
  claudeOpus: 'claude-opus-4-8',
  codex: 'gpt-5.6',
} as const;

/**
 * Validated OpenRouter preset model ids (verified against provider docs
 * 2026-07-10). Presets are suggestions, not global defaults or fallback policy.
 */
export const OPENROUTER_MODEL_IDS = {
  minimax: 'minimax/minimax-m3',
  glm: 'z-ai/glm-5.2',
  grok: 'x-ai/grok-4.5',
} as const;

/** OpenRouter model ids invoked through the native OpenCode lane. */
export const OPENCODE_MODEL_IDS = {
  /** Vision-capable adversarial design evaluator. */
  visionEval: 'openrouter/moonshotai/kimi-k2.6',
} as const;
