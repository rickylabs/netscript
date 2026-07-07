/**
 * OpenAI-compatible model-provider adapter — wraps `@tanstack/ai-openai/compatible`.
 *
 * This adapter exposes any OpenAI-compatible endpoint (its own base URL, API
 * key, and model list) through the E1 {@linkcode ModelProviderPort}, and
 * constructs the underlying TanStack OpenAI-compatible client on demand
 * ({@linkcode OpenAiCompatibleModelProvider.createChatClient}). It is registered
 * into the shared model registry by the `@netscript/ai/openai-compatible`
 * subpath entrypoint; this file holds the implementation and takes the heavy
 * provider SDK dependency, keeping the base `@netscript/ai` entrypoint free of
 * it.
 *
 * @module
 */

import { openaiCompatible } from '@tanstack/ai-openai/compatible';

import type { GenerationOptions } from '../contracts/generation.ts';
import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import { toTanstackChatClient } from './tanstack-chat-client.ts';

/**
 * Registry id under which {@linkcode OpenAiCompatibleModelProvider} self-registers.
 */
export const OPENAI_COMPATIBLE_PROVIDER_ID = 'openai-compatible' as const;

/**
 * Map per-turn {@linkcode GenerationOptions} to the OpenAI Chat Completions
 * request-body keys: a reasoning tier maps to the flat `reasoning_effort` field,
 * and `maxOutputTokens` maps to `max_tokens`. `'off'` is treated as "no explicit
 * reasoning request" (the OpenAI wire has no disable value, so `reasoning_effort`
 * is simply omitted and the model default applies). Returns `undefined` when the
 * options carry nothing OpenAI models. Pure and unit-testable; the caller's
 * `providerOptions` escape hatch is merged separately by the bridge.
 */
export function openAiCompatibleGenerationModelOptions(
  options: GenerationOptions,
): Readonly<Record<string, unknown>> | undefined {
  const modelOptions: Record<string, unknown> = {};
  const effort = options.reasoningEffort;
  if (effort !== undefined && effort !== 'off') {
    modelOptions.reasoning_effort = effort;
  }
  if (options.maxOutputTokens !== undefined) {
    modelOptions.max_tokens = options.maxOutputTokens;
  }
  return Object.keys(modelOptions).length > 0 ? modelOptions : undefined;
}

/**
 * Which underlying OpenAI API surface the endpoint speaks.
 */
export type OpenAiCompatibleApi = 'chat-completions' | 'responses';

/**
 * Configuration for {@linkcode OpenAiCompatibleModelProvider}.
 *
 * `baseURL` and `apiKey` are required to construct a client; a provider may be
 * registered without them (an unconfigured provider still lists and reports its
 * `models`) but {@linkcode OpenAiCompatibleModelProvider.createChatClient} then
 * rejects with {@linkcode AiNotConfiguredError}.
 */
export interface OpenAiCompatibleModelProviderConfig {
  /** Base URL of the OpenAI-compatible endpoint (e.g. `https://api.deepseek.com/v1`). */
  readonly baseURL?: string;
  /** API key for the endpoint. */
  readonly apiKey?: string;
  /** Model ids the endpoint exposes. Drives `listModels` / `supports`. */
  readonly models?: readonly string[];
  /** Which OpenAI API the endpoint implements (defaults to `chat-completions`). */
  readonly api?: OpenAiCompatibleApi;
  /** Display name for the provider (defaults to `"openai-compatible"`). */
  readonly name?: string;
}

const DEFAULT_INPUT_MODALITIES = ['text', 'image'] as const;

/**
 * A {@linkcode ModelProviderPort} backed by `@tanstack/ai-openai/compatible`.
 *
 * Unlike the Anthropic provider there is no fixed catalog: the endpoint's
 * models come from {@linkcode OpenAiCompatibleModelProviderConfig.models}. When
 * no models are configured the provider is *optimistic* — `supports` returns
 * `true` and `getModel` resolves any id — since the remote endpoint is the
 * authority on its own catalog. Streaming clients created by
 * {@linkcode OpenAiCompatibleModelProvider.createChatClient} are cancelled by
 * passing an `AbortController` to the TanStack `chat()` / `chatStream()` call —
 * the documented stop path for long-lived streams (F-13).
 *
 * @example Register and configure a DeepSeek endpoint
 * ```ts
 * import '@netscript/ai/openai-compatible'; // self-registers the provider
 * import { getModelProvider } from '@netscript/ai';
 *
 * const provider = getModelProvider('openai-compatible', {
 *   baseURL: 'https://api.deepseek.com/v1',
 *   apiKey: Deno.env.get('DEEPSEEK_KEY'),
 *   models: ['deepseek-chat', 'deepseek-reasoner'],
 * });
 * ```
 */
export class OpenAiCompatibleModelProvider implements ModelProviderPort {
  /** Stable registry id (`"openai-compatible"`). */
  readonly id: string = OPENAI_COMPATIBLE_PROVIDER_ID;
  readonly #config: OpenAiCompatibleModelProviderConfig;

  /** Construct a provider bound to the given `config` (defaults to `{}`). */
  constructor(config: OpenAiCompatibleModelProviderConfig = {}) {
    this.#config = config;
  }

  /**
   * List the configured models, or an empty list when none are configured.
   */
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
          `Model "${modelId}" is not offered by the "${OPENAI_COMPATIBLE_PROVIDER_ID}" provider.`,
        ),
      );
    }
    return Promise.resolve({ providerId: this.id, descriptor: this.#describe(modelId) });
  }

  /**
   * Whether the provider offers `modelId`. Optimistically `true` when no
   * `models` are configured (the remote endpoint owns its catalog).
   */
  supports(modelId: ModelId): boolean {
    const models = this.#config.models;
    return models === undefined || models.length === 0 ? true : models.includes(modelId);
  }

  /**
   * Construct an owned {@linkcode ChatClientPort} for `model`.
   *
   * The wrapped TanStack OpenAI-compatible text adapter is translated to the
   * owned chat vocabulary internally (no provider-SDK type escapes the public
   * surface). Per-turn cancellation flows through the port's
   * `stream(_, { signal })` option, which forwards to the TanStack
   * `AbortController` — the documented stop path so no request is left
   * un-cancellable (F-13).
   *
   * @param model - A model id the endpoint exposes.
   * @returns An owned chat client bound to `model`.
   * @throws {AiNotConfiguredError} When `baseURL` or `apiKey` is missing.
   *
   * @example Stream one turn with cancellation
   * ```ts
   * const provider = new OpenAiCompatibleModelProvider({
   *   baseURL: 'https://api.deepseek.com/v1',
   *   apiKey,
   * });
   * const client = provider.createChatClient('deepseek-chat');
   * const abort = new AbortController();
   * setTimeout(() => abort.abort(), 5_000);
   * for await (const event of client.stream({ messages }, { signal: abort.signal })) {
   *   if (event.type === 'text') console.log(event.delta);
   * }
   * ```
   */
  createChatClient(model: string): ChatClientPort {
    const { baseURL, apiKey, models, api, name } = this.#config;
    if (baseURL === undefined || apiKey === undefined) {
      throw new AiNotConfiguredError(
        OPENAI_COMPATIBLE_PROVIDER_ID,
        'Provide `baseURL` and `apiKey` to construct a client.',
      );
    }
    const factory = openaiCompatible({
      name: name ?? OPENAI_COMPATIBLE_PROVIDER_ID,
      baseURL,
      apiKey,
      models: models ?? [model],
      api,
    });
    const adapter = factory(model);
    return toTanstackChatClient(adapter, {
      name: name ?? OPENAI_COMPATIBLE_PROVIDER_ID,
      kind: 'text',
      mapModelOptions: openAiCompatibleGenerationModelOptions,
    });
  }

  /** Build the {@linkcode ModelDescriptor} for a model id. */
  #describe(id: string): ModelDescriptor {
    return {
      id,
      provider: OPENAI_COMPATIBLE_PROVIDER_ID,
      displayName: id,
      capabilities: {
        streaming: true,
        tools: true,
        inputModalities: DEFAULT_INPUT_MODALITIES,
      },
    };
  }
}
