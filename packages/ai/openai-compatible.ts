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
 * 2. Registers the same provider family for the dedicated vision capability.
 * 3. **Re-exports** the model and vision adapters for direct construction.
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
import type { VisionProviderConfig } from './src/ports/vision.ts';
import { registerVisionProvider } from './src/ports/vision.ts';
import {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
  type OpenAiCompatibleModelProviderConfig,
} from './src/adapters/openai-compatible.adapter.ts';
import {
  OpenAiVisionProvider,
  type OpenAiVisionProviderConfig,
} from './src/adapters/openai-vision.adapter.ts';

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

function readOpenAiVisionConfig(config?: VisionProviderConfig): OpenAiVisionProviderConfig {
  return {
    apiKey: typeof config?.apiKey === 'string' ? config.apiKey : undefined,
    baseURL: typeof config?.baseURL === 'string' ? config.baseURL : undefined,
    model: typeof config?.model === 'string' ? config.model : undefined,
    fetch: typeof config?.fetch === 'function' ? config.fetch as typeof fetch : undefined,
  };
}

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerModelProvider(
  OPENAI_COMPATIBLE_PROVIDER_ID,
  (config) => new OpenAiCompatibleModelProvider(readOpenAiCompatibleConfig(config)),
);
registerVisionProvider(
  OPENAI_COMPATIBLE_PROVIDER_ID,
  (config) => new OpenAiVisionProvider(readOpenAiVisionConfig(config)),
);

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
export {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
} from './src/adapters/openai-compatible.adapter.ts';
export {
  DEFAULT_OPENAI_VISION_MODEL,
  OPENAI_VISION_PROVIDER_ID,
  OpenAiVisionProvider,
} from './src/adapters/openai-vision.adapter.ts';
export type {
  OpenAiCompatibleApi,
  OpenAiCompatibleModelProviderConfig,
} from './src/adapters/openai-compatible.adapter.ts';
export type { OpenAiVisionProviderConfig } from './src/adapters/openai-vision.adapter.ts';
export type { VisionCallOptions, VisionProviderPort, VisionResponse } from './src/ports/vision.ts';
