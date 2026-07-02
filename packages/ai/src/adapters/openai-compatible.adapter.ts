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
import type {
  OpenAICompatibleChatAdapter,
  OpenAICompatibleResponsesAdapter,
} from '@tanstack/ai-openai/compatible';

import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';

/**
 * Registry id under which {@linkcode OpenAiCompatibleModelProvider} self-registers.
 */
export const OPENAI_COMPATIBLE_PROVIDER_ID = 'openai-compatible' as const;

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

/**
 * The wrapped TanStack OpenAI-compatible text client, over either the Chat
 * Completions or Responses API.
 */
export type OpenAiCompatibleTextClient =
  | OpenAICompatibleChatAdapter<string>
  | OpenAICompatibleResponsesAdapter<string>;

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
   * Construct the underlying TanStack OpenAI-compatible text client for `model`.
   *
   * The returned adapter drives chat/streaming. In-flight streams are cancelled
   * by passing an `AbortController` to the TanStack `chat()` / `chatStream()`
   * call, e.g. `chat({ adapter, messages, abortController })` — the documented
   * stop path so no request is left un-cancellable (F-13).
   *
   * @param model - A model id the endpoint exposes.
   * @returns The wrapped TanStack OpenAI-compatible text adapter.
   * @throws {AiNotConfiguredError} When `baseURL` or `apiKey` is missing.
   *
   * @example Cancel a stream after a timeout
   * ```ts
   * const provider = new OpenAiCompatibleModelProvider({
   *   baseURL: 'https://api.deepseek.com/v1',
   *   apiKey,
   * });
   * const adapter = provider.createChatClient('deepseek-chat');
   * const abortController = new AbortController();
   * setTimeout(() => abortController.abort(), 5_000);
   * // chat({ adapter, messages, abortController });
   * ```
   */
  createChatClient(model: string): OpenAiCompatibleTextClient {
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
    return factory(model);
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
