/**
 * Ollama provider entrypoint for `@netscript/ai`.
 *
 * Importing this module has two effects, mirroring `@netscript/ai/openai-compatible`:
 *
 * 1. **Self-registers** the `'ollama'` {@linkcode OllamaModelProvider} factory
 *    into the shared model registry ({@linkcode registerModelProvider}), so
 *    `getModelProvider('ollama', …)` / `getModel('ollama:…')` resolve without any
 *    explicit wiring.
 * 2. **Re-exports** {@linkcode OllamaModelProvider}, its id/config, and the
 *    reachability port surface for direct construction and preflight.
 *
 * The base `@netscript/ai` entrypoint never imports this module, so
 * `@tanstack/ai-openai` (and the OpenAI SDK it pulls) stay out of the module
 * graph until an app opts in with a one-line side-effect import:
 *
 * ```ts
 * import '@netscript/ai/ollama';
 * ```
 *
 * @module
 */

import type { ModelProviderConfig } from './src/ports/model-provider.ts';
import { registerModelProvider } from './src/ports/model-provider.ts';
import {
  OLLAMA_PROVIDER_ID,
  OllamaModelProvider,
  type OllamaModelProviderConfig,
} from './src/adapters/ollama.adapter.ts';
import type { ReachabilityPort } from './src/ports/reachability.ts';

/** Narrow an opaque registry config bag to the Ollama provider config. */
function readOllamaConfig(config?: ModelProviderConfig): OllamaModelProviderConfig {
  const models = config?.models;
  return {
    host: typeof config?.host === 'string' ? config.host : undefined,
    models: Array.isArray(models)
      ? models.filter((m): m is string => typeof m === 'string')
      : undefined,
    reachability: isReachabilityPort(config?.reachability) ? config.reachability : undefined,
    fetch: isFetch(config?.fetch) ? config.fetch : undefined,
  };
}

/** Type guard: a value is a `fetch`-shaped function. */
function isFetch(value: unknown): value is typeof fetch {
  return typeof value === 'function';
}

/** Type guard: an opaque config value is a {@linkcode ReachabilityPort}. */
function isReachabilityPort(value: unknown): value is ReachabilityPort {
  return isRecord(value) && typeof value.checkReachable === 'function';
}

/** Type guard: a value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// ---------------------------------------------------------------------------
// Self-registration — runs once on first import of this module.
// ---------------------------------------------------------------------------
registerModelProvider(
  OLLAMA_PROVIDER_ID,
  (config) => new OllamaModelProvider(readOllamaConfig(config)),
);

// ---------------------------------------------------------------------------
// Public re-exports
// ---------------------------------------------------------------------------
export {
  DEFAULT_OLLAMA_HOST,
  OLLAMA_PROVIDER_ID,
  OllamaModelProvider,
} from './src/adapters/ollama.adapter.ts';
export type { OllamaModelProviderConfig } from './src/adapters/ollama.adapter.ts';
export {
  createHttpReachabilityPort,
  DEFAULT_REACHABILITY_PATH,
  HttpReachabilityAdapter,
} from './src/adapters/http-reachability.adapter.ts';
export type { HttpReachabilityConfig } from './src/adapters/http-reachability.adapter.ts';
export { createAssumeReachablePort } from './src/ports/reachability.ts';
export type {
  ReachabilityCheckOptions,
  ReachabilityPort,
  ReachabilityResult,
} from './src/ports/reachability.ts';
