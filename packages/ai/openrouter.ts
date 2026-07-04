/**
 * OpenRouter provider entrypoint for `@netscript/ai`.
 *
 * Importing this module has two effects, mirroring `@netscript/ai/openai-compatible`:
 *
 * 1. **Self-registers** the `'openrouter'` {@linkcode OpenRouterModelProvider}
 *    factory into the shared model registry ({@linkcode registerModelProvider}),
 *    so `getModelProvider('openrouter', …)` / `getModel('openrouter:…')` resolve
 *    without any explicit wiring.
 * 2. **Re-exports** {@linkcode OpenRouterModelProvider}, its id/config, and the
 *    reasoning-shape normalizer for direct construction and testing.
 *
 * The base `@netscript/ai` entrypoint never imports this module, so
 * `@tanstack/ai-openai` (and the OpenAI SDK it pulls) stay out of the module
 * graph until an app opts in with a one-line side-effect import:
 *
 * ```ts
 * import '@netscript/ai/openrouter';
 * ```
 *
 * @module
 */

import type { ModelProviderConfig } from './src/ports/model-provider.ts';
import { registerModelProvider } from './src/ports/model-provider.ts';
import {
  OPENROUTER_PROVIDER_ID,
  OpenRouterModelProvider,
  type OpenRouterModelProviderConfig,
  type ReasoningEffort,
} from './src/adapters/openrouter.adapter.ts';

const REASONING_EFFORTS: readonly string[] = ['low', 'medium', 'high'];

/** Narrow an opaque registry config bag to the OpenRouter provider config. */
function readOpenRouterConfig(config?: ModelProviderConfig): OpenRouterModelProviderConfig {
  const models = config?.models;
  const reasoningEffort = config?.reasoningEffort;
  return {
    apiKey: typeof config?.apiKey === 'string' ? config.apiKey : undefined,
    baseURL: typeof config?.baseURL === 'string' ? config.baseURL : undefined,
    models: Array.isArray(models)
      ? models.filter((m): m is string => typeof m === 'string')
      : undefined,
    reasoningEffort: isReasoningEffort(reasoningEffort) ? reasoningEffort : undefined,
  };
}

/** Type guard: an opaque config value is a known {@linkcode ReasoningEffort}. */
function isReasoningEffort(value: unknown): value is ReasoningEffort {
  return typeof value === 'string' && REASONING_EFFORTS.includes(value);
}

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerModelProvider(
  OPENROUTER_PROVIDER_ID,
  (config) => new OpenRouterModelProvider(readOpenRouterConfig(config)),
);

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
export {
  DEFAULT_OPENROUTER_BASE_URL,
  OPENROUTER_API_KEY_ENV,
  OPENROUTER_PROVIDER_ID,
  OpenRouterModelProvider,
  openRouterReasoningModelOptions,
} from './src/adapters/openrouter.adapter.ts';
export type {
  OpenRouterModelProviderConfig,
  ReasoningEffort,
} from './src/adapters/openrouter.adapter.ts';
