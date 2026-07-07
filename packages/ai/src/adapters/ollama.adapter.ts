/**
 * Ollama model-provider adapter — wraps `@tanstack/ai-openai/compatible`.
 *
 * Ollama exposes an OpenAI-compatible endpoint at `{host}/v1`, so this adapter
 * reuses the same TanStack OpenAI-compatible transport as the OpenAI-compatible
 * and OpenRouter providers — pointed at the local host — with two differences:
 *
 * 1. **No-key auth.** Ollama is local and ignores authorization; the OpenAI
 *    client still requires a non-empty key, so a fixed placeholder is sent.
 * 2. **Reachability preflight.** A local daemon may simply be down, so the
 *    provider exposes {@linkcode OllamaModelProvider.checkReachable} backed by a
 *    {@linkcode ReachabilityPort} (default: fetch `GET {host}/api/tags`) that
 *    returns a typed, non-throwing {@linkcode ReachabilityResult} for graceful
 *    degradation.
 *
 * Ollama has no reasoning-effort wire, so this provider emits no reasoning
 * `modelOptions`. Registered by the `@netscript/ai/ollama` subpath entrypoint.
 *
 * @module
 */

import { openaiCompatible } from '@tanstack/ai-openai/compatible';

import type { GenerationOptions } from '../contracts/generation.ts';
import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import type {
  ReachabilityCheckOptions,
  ReachabilityPort,
  ReachabilityResult,
} from '../ports/reachability.ts';
import { toTanstackChatClient } from './tanstack-chat-client.ts';
import { HttpReachabilityAdapter } from './http-reachability.adapter.ts';

/**
 * Registry id under which {@linkcode OllamaModelProvider} self-registers.
 */
export const OLLAMA_PROVIDER_ID = 'ollama' as const;

/**
 * Default Ollama host (the daemon's local address).
 */
export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434' as const;

/**
 * Placeholder API key. Ollama ignores authorization, but the underlying OpenAI
 * client requires a non-empty key.
 */
const OLLAMA_PLACEHOLDER_KEY = 'ollama' as const;

const DEFAULT_INPUT_MODALITIES = ['text', 'image'] as const;

/**
 * Map per-turn {@linkcode GenerationOptions} to Ollama's request-body keys.
 *
 * Ollama's OpenAI-compatible endpoint has **no reasoning-effort wire**, so
 * `reasoningEffort` is a documented **no-op** here (any tier, including `'off'`,
 * is ignored). Only `maxOutputTokens` is mapped, to `max_tokens`. Returns
 * `undefined` when the options carry nothing Ollama models. Pure and
 * unit-testable; the caller's `providerOptions` escape hatch is merged
 * separately by the bridge, so a caller can still force raw Ollama options.
 */
export function ollamaGenerationModelOptions(
  options: GenerationOptions,
): Readonly<Record<string, unknown>> | undefined {
  const modelOptions: Record<string, unknown> = {};
  // reasoningEffort intentionally ignored: Ollama has no reasoning-effort wire.
  if (options.maxOutputTokens !== undefined) {
    modelOptions.max_tokens = options.maxOutputTokens;
  }
  return Object.keys(modelOptions).length > 0 ? modelOptions : undefined;
}

/**
 * Configuration for {@linkcode OllamaModelProvider}.
 */
export interface OllamaModelProviderConfig {
  /** Base host of the Ollama daemon (defaults to `http://localhost:11434`). */
  readonly host?: string;
  /** Model ids to expose. Drives `listModels` / `supports`. */
  readonly models?: readonly string[];
  /**
   * Reachability port used by {@linkcode OllamaModelProvider.checkReachable}.
   * Defaults to a fetch-backed probe of `GET {host}/api/tags`.
   */
  readonly reachability?: ReachabilityPort;
  /** Fetch implementation for the default reachability probe (tests). */
  readonly fetch?: typeof fetch;
}

/**
 * A {@linkcode ModelProviderPort} backed by `@tanstack/ai-openai/compatible`,
 * pinned to a local Ollama daemon with a reachability preflight.
 *
 * @example Preflight before a turn, then stream
 * ```ts
 * import '@netscript/ai/ollama'; // self-registers the provider
 * import { getModelProvider } from '@netscript/ai';
 *
 * const provider = getModelProvider('ollama', { models: ['llama3.2'] });
 * const health = await provider.checkReachable();
 * if (!health.reachable) {
 *   console.warn(`Ollama is down: ${health.detail}`);
 * }
 * ```
 */
export class OllamaModelProvider implements ModelProviderPort {
  /** Stable registry id (`"ollama"`). */
  readonly id: string = OLLAMA_PROVIDER_ID;
  readonly #config: OllamaModelProviderConfig;
  readonly #reachability: ReachabilityPort;

  /** Construct a provider bound to the given `config` (defaults to `{}`). */
  constructor(config: OllamaModelProviderConfig = {}) {
    this.#config = config;
    this.#reachability = config.reachability ??
      new HttpReachabilityAdapter({ fetch: config.fetch });
  }

  /** The resolved Ollama host. */
  get host(): string {
    return this.#config.host ?? DEFAULT_OLLAMA_HOST;
  }

  /** List the configured models, or an empty list when none are configured. */
  listModels(): Promise<readonly ModelDescriptor[]> {
    const models = this.#config.models ?? [];
    return Promise.resolve(models.map((id) => this.#describe(id)));
  }

  /**
   * Resolve a model id to a {@linkcode ModelHandle}.
   *
   * @throws {AiError} When `models` is configured and `modelId` is not in it.
   */
  getModel(modelId: ModelId): Promise<ModelHandle> {
    if (!this.supports(modelId)) {
      return Promise.reject(
        new AiError(
          `Model "${modelId}" is not offered by the "${OLLAMA_PROVIDER_ID}" provider.`,
        ),
      );
    }
    return Promise.resolve({ providerId: this.id, descriptor: this.#describe(modelId) });
  }

  /**
   * Whether the provider offers `modelId`. Optimistically `true` when no
   * `models` are configured (the local daemon owns its catalog).
   */
  supports(modelId: ModelId): boolean {
    const models = this.#config.models;
    return models === undefined || models.length === 0 ? true : models.includes(modelId);
  }

  /**
   * Probe whether the Ollama daemon is up, without throwing.
   *
   * @param options - Optional cancellation signal.
   * @returns A typed {@linkcode ReachabilityResult} so callers degrade
   * gracefully instead of failing mid-turn.
   */
  checkReachable(options?: ReachabilityCheckOptions): Promise<ReachabilityResult> {
    return this.#reachability.checkReachable(this.host, options);
  }

  /**
   * Construct an owned {@linkcode ChatClientPort} for `model` over the Ollama
   * OpenAI-compatible endpoint (`{host}/v1`). Sends a placeholder key since
   * Ollama ignores authorization, and emits no reasoning `modelOptions`.
   * Per-turn cancellation flows through the port's `stream(_, { signal })`
   * option (F-13).
   *
   * @param model - A model id the daemon exposes.
   */
  createChatClient(model: ModelId): ChatClientPort {
    const factory = openaiCompatible({
      name: OLLAMA_PROVIDER_ID,
      baseURL: `${this.host.replace(/\/+$/, '')}/v1`,
      apiKey: OLLAMA_PLACEHOLDER_KEY,
      models: this.#config.models ?? [model],
    });
    const adapter = factory(model);
    return toTanstackChatClient(adapter, {
      name: OLLAMA_PROVIDER_ID,
      kind: 'text',
      mapModelOptions: ollamaGenerationModelOptions,
    });
  }

  /** Build the {@linkcode ModelDescriptor} for a model id. */
  #describe(id: string): ModelDescriptor {
    return {
      id,
      provider: OLLAMA_PROVIDER_ID,
      displayName: id,
      capabilities: {
        streaming: true,
        tools: true,
        inputModalities: DEFAULT_INPUT_MODALITIES,
      },
    };
  }
}
