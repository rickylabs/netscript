/**
 * Anthropic provider entrypoint for `@netscript/ai`.
 *
 * Importing this module has two effects, mirroring `@netscript/kv/redis`:
 *
 * 1. **Self-registers** the `'anthropic'` {@linkcode AnthropicModelProvider}
 *    factory into the shared model registry ({@linkcode registerModelProvider}),
 *    so `getModelProvider('anthropic')` / `getModel('anthropic:…')` resolve
 *    without any explicit wiring.
 * 2. **Re-exports** {@linkcode AnthropicModelProvider} and its id/config for
 *    direct construction.
 *
 * The base `@netscript/ai` entrypoint never imports this module, so
 * `@tanstack/ai-anthropic` (and the Anthropic SDK it pulls) stay out of the
 * module graph until an app opts in with a one-line side-effect import:
 *
 * ```ts
 * import '@netscript/ai/anthropic';
 * ```
 *
 * @module
 */

import type { ModelProviderConfig } from './src/ports/model-provider.ts';
import { registerModelProvider } from './src/ports/model-provider.ts';
import {
  ANTHROPIC_PROVIDER_ID,
  AnthropicModelProvider,
  type AnthropicModelProviderConfig,
} from './src/adapters/anthropic.adapter.ts';

/** Narrow an opaque registry config bag to the Anthropic provider config. */
function readAnthropicConfig(config?: ModelProviderConfig): AnthropicModelProviderConfig {
  return {
    apiKey: typeof config?.apiKey === 'string' ? config.apiKey : undefined,
    baseURL: typeof config?.baseURL === 'string' ? config.baseURL : undefined,
  };
}

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerModelProvider(
  ANTHROPIC_PROVIDER_ID,
  (config) => new AnthropicModelProvider(readAnthropicConfig(config)),
);

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
export { ANTHROPIC_PROVIDER_ID, AnthropicModelProvider } from './src/adapters/anthropic.adapter.ts';
export type { AnthropicModelProviderConfig } from './src/adapters/anthropic.adapter.ts';
