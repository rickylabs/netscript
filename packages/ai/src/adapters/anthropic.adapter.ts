/**
 * Anthropic model-provider adapter — wraps `@tanstack/ai-anthropic`.
 *
 * This adapter surfaces the TanStack Anthropic model catalog through the E1
 * {@linkcode ModelProviderPort} (discovery: `listModels` / `getModel` /
 * `supports`) and constructs the underlying TanStack text client on demand
 * ({@linkcode AnthropicModelProvider.createChatClient}). It is registered into
 * the shared model registry by the `@netscript/ai/anthropic` subpath entrypoint;
 * this file holds the implementation and takes the heavy provider SDK
 * dependency, keeping the base `@netscript/ai` entrypoint free of it.
 *
 * @module
 */

import { ANTHROPIC_MODELS, anthropicText, createAnthropicChat } from '@tanstack/ai-anthropic';

import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import { toTanstackChatClient } from './tanstack-chat-client.ts';

/**
 * Registry id under which {@linkcode AnthropicModelProvider} self-registers.
 */
export const ANTHROPIC_PROVIDER_ID = 'anthropic' as const;

/**
 * Configuration for {@linkcode AnthropicModelProvider}.
 *
 * All fields are optional: when `apiKey` is omitted the wrapped TanStack client
 * falls back to the `ANTHROPIC_API_KEY` environment variable at construction.
 */
export interface AnthropicModelProviderConfig {
  /** Anthropic API key. Falls back to `ANTHROPIC_API_KEY` when omitted. */
  readonly apiKey?: string;
  /** Override the API base URL (e.g. to route through a gateway/proxy). */
  readonly baseURL?: string;
}

const INPUT_MODALITIES = ['text', 'image', 'document'] as const;

/**
 * A {@linkcode ModelProviderPort} backed by `@tanstack/ai-anthropic`.
 *
 * The model catalog is taken verbatim from the wrapped package's
 * `ANTHROPIC_MODELS`, so it stays in lockstep with the upstream adapter rather
 * than duplicating a model list. Streaming clients created by
 * {@linkcode AnthropicModelProvider.createChatClient} are cancelled by passing
 * an `AbortController` to the TanStack `chat()` / `chatStream()` call — the
 * documented stop path for long-lived streams (F-13).
 *
 * @example Register and resolve a model
 * ```ts
 * import '@netscript/ai/anthropic'; // self-registers the provider
 * import { getModel } from '@netscript/ai';
 *
 * const handle = await getModel('anthropic:claude-sonnet-4-5');
 * ```
 */
export class AnthropicModelProvider implements ModelProviderPort {
  /** Stable registry id (`"anthropic"`). */
  readonly id: string = ANTHROPIC_PROVIDER_ID;
  readonly #config: AnthropicModelProviderConfig;

  /** Construct a provider bound to the given `config` (defaults to `{}`). */
  constructor(config: AnthropicModelProviderConfig = {}) {
    this.#config = config;
  }

  /**
   * List every model exposed by the wrapped TanStack Anthropic adapter.
   */
  listModels(): Promise<readonly ModelDescriptor[]> {
    return Promise.resolve(ANTHROPIC_MODELS.map((id) => describeAnthropicModel(id)));
  }

  /**
   * Resolve a model id to a {@linkcode ModelHandle}.
   *
   * @throws {AiError} When `modelId` is not part of the Anthropic catalog.
   */
  getModel(modelId: ModelId): Promise<ModelHandle> {
    if (!this.supports(modelId)) {
      return Promise.reject(
        new AiError(
          `Model "${modelId}" is not offered by the "${ANTHROPIC_PROVIDER_ID}" provider.`,
        ),
      );
    }
    return Promise.resolve({
      providerId: this.id,
      descriptor: describeAnthropicModel(modelId),
    });
  }

  /** Whether `modelId` is a member of the Anthropic catalog. */
  supports(modelId: ModelId): boolean {
    return (ANTHROPIC_MODELS as readonly string[]).includes(modelId);
  }

  /**
   * Construct an owned {@linkcode ChatClientPort} for `model`.
   *
   * The wrapped TanStack Anthropic text adapter is translated to the owned
   * chat vocabulary internally (no provider-SDK type escapes the public
   * surface). Per-turn cancellation flows through the port's
   * `stream(_, { signal })` option, which forwards to the TanStack
   * `AbortController` — the documented stop path so no request is left
   * un-cancellable (F-13).
   *
   * @param model - A model id from the Anthropic catalog.
   * @returns An owned chat client bound to `model`.
   * @throws {AiError} When `model` is not in the Anthropic catalog.
   *
   * @example Stream one turn with cancellation
   * ```ts
   * const provider = new AnthropicModelProvider({ apiKey });
   * const client = provider.createChatClient('claude-sonnet-4-5');
   * const abort = new AbortController();
   * setTimeout(() => abort.abort(), 5_000);
   * for await (const event of client.stream({ messages }, { signal: abort.signal })) {
   *   if (event.type === 'text') console.log(event.delta);
   * }
   * ```
   */
  createChatClient(model: ModelId): ChatClientPort {
    // Narrow the owned string id against the runtime catalog so no
    // `@tanstack/ai-anthropic` type appears in the public signature (D3).
    const resolved = ANTHROPIC_MODELS.find((candidate) => candidate === model);
    if (resolved === undefined) {
      throw new AiError(
        `Model "${model}" is not offered by the "${ANTHROPIC_PROVIDER_ID}" provider.`,
      );
    }
    const { apiKey, baseURL } = this.#config;
    const clientConfig = baseURL === undefined ? undefined : { baseURL };
    const adapter = apiKey === undefined
      ? anthropicText(resolved, clientConfig)
      : createAnthropicChat(resolved, apiKey, clientConfig);
    return toTanstackChatClient(adapter, { name: ANTHROPIC_PROVIDER_ID, kind: 'text' });
  }
}

/** Build the {@linkcode ModelDescriptor} for an Anthropic model id. */
function describeAnthropicModel(id: string): ModelDescriptor {
  return {
    id,
    provider: ANTHROPIC_PROVIDER_ID,
    displayName: id,
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
      inputModalities: INPUT_MODALITIES,
    },
  };
}
