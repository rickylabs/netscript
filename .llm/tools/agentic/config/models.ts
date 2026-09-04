/**
 * Central, typed, single-source model identifiers for the agentic suite.
 *
 * MONTHLY MAINTENANCE: change a model id HERE. Two authorities consume these
 * constants and remain the ONLY places that bind a model to a purpose:
 *  - `runtime/delegation-matrix.ts` — the workload/coordinator role → logical
 *    model → effort bindings rendered by `.llm/harness/workflow/lane-policy.md`.
 *    That matrix is the single source for routing; this module is the single
 *    source for the model-id strings its capability catalog references.
 *  - `runtime/provider-profiles.ts` `OPENROUTER_PRESETS` — caller-selected
 *    OpenRouter presets, whose model ids come from `OPENROUTER_MODEL_IDS`.
 *
 * There is no other hardcoded model-id literal under `.llm/tools/agentic/**`
 * (enforced by `config/no-hardcoded-volatile_test.ts`).
 */

/** Preview Agent Tasks create catalog; never infer these from connector capabilities. */
export const COPILOT_AGENT_TASK_MODEL_IDS = [
  'claude-sonnet-4.6',
  'claude-opus-4.6',
  'gpt-5.2-codex',
  'gpt-5.3-codex',
  'gpt-5.4',
] as const;

/** First-party (native provider) model ids used by the canonical route policy. */
export const MODEL_IDS = {
  /** OpenAI/Codex balanced default. */
  codexSol: 'gpt-5.6-sol',
  /** OpenAI/Codex fast-iteration model. */
  codexLuna: 'gpt-5.6-luna',
  /** Anthropic/Claude most-capable model. */
  fable: 'fable-5',
  /** Anthropic/Claude orchestration, review, documentation, and workflow model. */
  opus: 'opus-5',
  /** Anthropic/Claude cost-efficient docs, chores, and token-limit review fallback. */
  sonnet: 'sonnet-5',
  /** Google/Antigravity CLI identifier. */
  antigravity: 'agy',
  /** Google/Antigravity documentation and evidence model. */
  antigravityDocs: 'gemini-3.6-flash-high',
} as const;

/** Provider-specific model spellings used by the replacement delegation matrix. */
export const ROUTING_MODEL_IDS = {
  lunaNative: 'gpt-5.6-luna',
  lunaGo: 'opencode-go/gpt-5.6-luna',
  solNative: 'gpt-5.6-sol',
  astraNative: 'gpt-6-astra',
  fable51Native: 'claude-fable-5-1',
  opus5Native: 'claude-opus-5',
  gemini38FlashNative: 'gemini-3.8-flash',
  gemini38FlashCopilot: 'github-copilot/gemini-3.8-flash',
  kimiK3Copilot: 'github-copilot/kimi-k3',
  grok46Copilot: 'github-copilot/grok-4.6',
  fable51Copilot: 'github-copilot/claude-fable-5.1',
  qwen38FlashNextGo: 'opencode-go/qwen3.8-flash',
  qwen38FlashNextOpenRouter: 'openrouter/qwen/qwen3.8-flash',
  qwen38MaxGo: 'opencode-go/qwen3.8-max',
  qwen38MaxOpenRouter: 'openrouter/qwen/qwen3.8-max',
  glm53FlashGo: 'opencode-go/glm-5.3-flash',
  glm53FlashOllama: 'ollama-cloud/glm-5.3-flash',
  glm53FlashOpenRouter: 'openrouter/z-ai/glm-5.3-flash',
  glm53Go: 'opencode-go/glm-5.3',
  glm53Ollama: 'ollama-cloud/glm-5.3',
  glm53OpenRouter: 'openrouter/z-ai/glm-5.3',
  museSpark13Go: 'opencode-go/muse-spark-1.3-contributor',
  museSpark13OpenRouter: 'openrouter/meta/muse-spark-1.3-contributor',
  minimaxM3Go: 'opencode-go/minimax-m3',
  minimaxM3Ollama: 'ollama-cloud/minimax-m3',
  minimaxM3OpenRouter: 'openrouter/minimax/minimax-m3',
  deepseekV4FlashGo: 'opencode-go/deepseek-v4-flash',
  deepseekV4FlashOllama: 'ollama-cloud/deepseek-v4-flash:0731',
  deepseekV4FlashOpenRouter: 'openrouter/deepseek/deepseek-v4-flash-0731',
  deepseekV4FlashVisionGo: 'opencode-go/deepseek-v4-flash-vision-exp',
  deepseekV4FlashVisionOpenRouter: 'openrouter/deepseek/deepseek-v4-flash-vision-exp',
  deepseekV4ProGo: 'opencode-go/deepseek-v4-pro',
  deepseekV4ProOllama: 'ollama-cloud/deepseek-v4-pro:0813',
  deepseekV4ProOpenRouter: 'openrouter/deepseek/deepseek-v4-pro-0813',
  kimiK3Go: 'opencode-go/kimi-k3',
  kimiK3Ollama: 'ollama-cloud/kimi-k3',
  kimiK3OpenRouter: 'openrouter/moonshotai/kimi-k3',
  grok46Go: 'opencode-go/grok-4.6',
  grok46OpenRouter: 'openrouter/x-ai/grok-4.6',
} as const;

/**
 * Native-provider model ids in the CLI-argument spelling the rollout canary
 * passes to `provider-canary` (`claude`/`codex` `--model` args). These use the
 * provider CLIs' own dashed spelling. Matrix capabilities now use these same
 * dispatchable CLI ids; this table remains the provider-canary argument set.
 */
export const NATIVE_CANARY_MODEL_ARGS = {
  claudeOpus: 'claude-opus-5',
  codex: 'gpt-5.6',
} as const;

/**
 * Current OpenRouter model ids approved for new route and preset selection.
 * Re-verified against the live OpenRouter catalog on 2026-08-30.
 */
export const OPENROUTER_MODEL_IDS = {
  /** Conditional formal PLAN-EVAL route. */
  planEvaluator: 'qwen/qwen3.8-flash',
  /** Formal IMPL-EVAL and hybrid/gateway default route. */
  implEvaluator: 'z-ai/glm-5.3-flash',
  /** Creative-design route retained independently of evaluator routing. */
  designGlm: 'z-ai/glm-5.2',
  grok: 'x-ai/grok-4.5',
} as const;

/**
 * Retired OpenRouter model ids accepted only while deserializing historical
 * run state. They are deliberately absent from every active selector.
 */
export const LEGACY_OPENROUTER_MODEL_IDS = {
  minimaxM3: 'minimax/minimax-m3',
  deepseekV4Flash0731: 'deepseek/deepseek-v4-flash-0731',
  qwen38Max: 'qwen/qwen3.8-max',
} as const;

/** OpenRouter models approved for explicit Claude hybrid delegation. */
export type CurrentOpenRouterModelId =
  typeof OPENROUTER_MODEL_IDS[keyof typeof OPENROUTER_MODEL_IDS];
export type LegacyOpenRouterModelId =
  typeof LEGACY_OPENROUTER_MODEL_IDS[keyof typeof LEGACY_OPENROUTER_MODEL_IDS];
export type HybridDelegationModelId =
  | typeof OPENROUTER_MODEL_IDS.implEvaluator
  | typeof OPENROUTER_MODEL_IDS.planEvaluator;
export const HYBRID_DELEGATION_MODEL_IDS: readonly HybridDelegationModelId[] = [
  OPENROUTER_MODEL_IDS.implEvaluator,
  OPENROUTER_MODEL_IDS.planEvaluator,
] as const;

/** Default OpenRouter worker for Claude hybrid delegation. */
export const HYBRID_DELEGATION_DEFAULT_MODEL: HybridDelegationModelId =
  OPENROUTER_MODEL_IDS.implEvaluator;

/** Open models approved for formal evaluation without paid closed-model routing. */
export const OPEN_EVALUATOR_MODEL_IDS: readonly [
  typeof OPENROUTER_MODEL_IDS.planEvaluator,
  typeof OPENROUTER_MODEL_IDS.implEvaluator,
] = [
  OPENROUTER_MODEL_IDS.planEvaluator,
  OPENROUTER_MODEL_IDS.implEvaluator,
] as const;
export type OpenEvaluatorModelId = typeof OPEN_EVALUATOR_MODEL_IDS[number];

/** OpenRouter model ids invoked through the native OpenCode lane. */
export const OPENCODE_MODEL_IDS = {
  /** Vision-capable adversarial design evaluator. */
  visionEval: 'openrouter/moonshotai/kimi-k3',
} as const;
