/**
 * OpenAI-compatible provider entrypoint for `@netscript/ai`.
 *
 * Importing this module has two effects, mirroring `@netscript/kv/redis`:
 *
 * 1. **Self-registers** the `'openai-compatible'`
 *    {@linkcode OpenAiCompatibleModelProvider} factory into the shared model
 *    registry ({@linkcode registerModelProvider}), so
 *    `getModelProvider('openai-compatible', { baseURL, apiKey, models })`
 *    resolves without any explicit wiring.
 * 2. **Re-exports** {@linkcode OpenAiCompatibleModelProvider} and its id/config
 *    for direct construction.
 *
 * The base `@netscript/ai` entrypoint never imports this module, so
 * `@tanstack/ai-openai` (and the OpenAI SDK it pulls) stay out of the module
 * graph until an app opts in with a one-line side-effect import:
 *
 * ```ts
 * import '@netscript/ai/openai-compatible';
 * ```
 *
 * @module
 */

import type { ModelProviderConfig } from './src/ports/model-provider.ts';
import { registerModelProvider } from './src/ports/model-provider.ts';
import {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
  type OpenAiCompatibleModelProviderConfig,
} from './src/adapters/openai-compatible.adapter.ts';

/** Narrow an opaque registry config bag to the OpenAI-compatible config. */
function readOpenAiCompatibleConfig(
  config?: ModelProviderConfig,
): OpenAiCompatibleModelProviderConfig {
  const models = config?.models;
  const api = config?.api;
  return {
    baseURL: typeof config?.baseURL === 'string' ? config.baseURL : undefined,
    apiKey: typeof config?.apiKey === 'string' ? config.apiKey : undefined,
    name: typeof config?.name === 'string' ? config.name : undefined,
    api: api === 'chat-completions' || api === 'responses' ? api : undefined,
    models: Array.isArray(models)
      ? models.filter((m): m is string => typeof m === 'string')
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerModelProvider(
  OPENAI_COMPATIBLE_PROVIDER_ID,
  (config) => new OpenAiCompatibleModelProvider(readOpenAiCompatibleConfig(config)),
);

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
export {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
} from './src/adapters/openai-compatible.adapter.ts';
export type {
  OpenAiCompatibleApi,
  OpenAiCompatibleModelProviderConfig,
} from './src/adapters/openai-compatible.adapter.ts';
