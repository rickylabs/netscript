/**
 * Transitional local model identifiers for the agentic suite.
 *
 * Harness owns workload/coordinator bindings and provider-specific route IDs.
 * This module re-exports its pinned model catalog and retains only the model
 * IDs needed by transitional local provider tools and OpenRouter presets.
 * Local preset IDs feed `runtime/provider-profiles.ts` `OPENROUTER_PRESETS`.
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

/** First-party model ids used by transitional local provider tools. */
export const MODEL_IDS: Readonly<{
  codexSol: typeof ROUTING_MODEL_IDS.solNative;
  codexLuna: typeof ROUTING_MODEL_IDS.lunaNative;
  fable: typeof ROUTING_MODEL_IDS.fable51Native;
  opus: typeof ROUTING_MODEL_IDS.opus55Native;
  sonnet: 'claude-sonnet-5-5';
  antigravity: 'agy';
  antigravityDocs: 'gemini-3.6-flash-high';
}> = {
  /** OpenAI/Codex default for ordinary work; former Luna cells use low, other Sol cells use xhigh. */
  codexSol: ROUTING_MODEL_IDS.solNative,
  /** OpenAI/Codex compatibility capability; no longer the simple-task default. */
  codexLuna: ROUTING_MODEL_IDS.lunaNative,
  /** Anthropic/Claude most-capable model. */
  fable: ROUTING_MODEL_IDS.fable51Native,
  /** Anthropic/Claude orchestration, review, documentation, and workflow model. */
  opus: ROUTING_MODEL_IDS.opus55Native,
  /** Anthropic/Claude cost-efficient docs, chores, and token-limit review fallback. */
  sonnet: 'claude-sonnet-5-5',
  /** Google/Antigravity CLI identifier. */
  antigravity: 'agy',
  /** Google/Antigravity documentation and evidence model. */
  antigravityDocs: 'gemini-3.6-flash-high',
} as const;

/** Harness owns the typed provider-specific routing model catalog. */
import { ROUTING_MODEL_IDS } from '@harness/models';
export { ROUTING_MODEL_IDS };

/**
 * Native-provider model ids in the CLI-argument spelling the rollout canary
 * passes to `provider-canary` (`claude`/`codex` `--model` args). These use the
 * provider CLIs' own dashed spelling. Matrix capabilities now use these same
 * dispatchable CLI ids; this table remains the provider-canary argument set.
 */
export const NATIVE_CANARY_MODEL_ARGS: Readonly<{
  claudeOpus: typeof ROUTING_MODEL_IDS.opus55Native;
  codex: typeof ROUTING_MODEL_IDS.solNative;
}> = {
  claudeOpus: ROUTING_MODEL_IDS.opus55Native,
  codex: ROUTING_MODEL_IDS.solNative,
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
