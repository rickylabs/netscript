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

import type { GenerationOptions } from '../contracts/generation.ts';
import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError, InvalidModelOptionsError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import { toTanstackChatClient } from './tanstack-chat-client.ts';

/**
 * Registry id under which {@linkcode AnthropicModelProvider} self-registers.
 */
export const ANTHROPIC_PROVIDER_ID = 'anthropic' as const;

/**
 * Map per-turn {@linkcode GenerationOptions} to Anthropic's native request-body
 * keys. A reasoning tier maps to the modern `output_config: { effort }` control;
 * `'off'` disables extended thinking via `thinking: { type: 'disabled' }`.
 * `maxOutputTokens` maps to `max_tokens`. Returns `undefined` when nothing is
 * set.
 *
 * The deprecated `thinking: { type: 'enabled', budget_tokens }` shape is
 * deliberately **never** emitted — recent Anthropic models reject it — so effort
 * always flows through `output_config`. Pure and unit-testable; the caller's
 * `providerOptions` escape hatch is merged separately by the bridge.
 */
export function anthropicGenerationModelOptions(
  options: GenerationOptions,
): Readonly<Record<string, unknown>> | undefined {
  const modelOptions: Record<string, unknown> = {};
  const effort = options.reasoningEffort;
  if (effort === 'off') {
    modelOptions.thinking = { type: 'disabled' };
  } else if (effort !== undefined) {
    modelOptions.output_config = { effort };
  }
  if (options.maxOutputTokens !== undefined) {
    modelOptions.max_tokens = options.maxOutputTokens;
  }
  return Object.keys(modelOptions).length > 0 ? modelOptions : undefined;
}

/** Reject Anthropic's deprecated fixed-budget thinking shape before transport. */
export function validateAnthropicModelOptions(
  options: Readonly<Record<string, unknown>>,
): void {
  const thinking = options.thinking;
  if (
    typeof thinking === 'object' && thinking !== null &&
    'type' in thinking && thinking.type === 'enabled' &&
    'budget_tokens' in thinking
  ) {
    throw new InvalidModelOptionsError(
      ANTHROPIC_PROVIDER_ID,
      '`thinking: { type: "enabled", budget_tokens }` is deprecated; use ' +
        '`thinking: { type: "adaptive" }` with `output_config.effort`.',
    );
  }
}

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
    return toTanstackChatClient((connection) => {
      const apiKey = nonEmpty(connection?.apiKey) ?? nonEmpty(this.#config.apiKey);
      const baseURL = nonEmpty(connection?.baseURL) ?? nonEmpty(this.#config.baseURL);
      const clientConfig = baseURL === undefined ? undefined : { baseURL };
      return apiKey === undefined
        ? anthropicText(resolved, clientConfig)
        : createAnthropicChat(resolved, apiKey, clientConfig);
    }, {
      name: ANTHROPIC_PROVIDER_ID,
      kind: 'text',
      mapModelOptions: anthropicGenerationModelOptions,
      validateModelOptions: validateAnthropicModelOptions,
    });
  }
}

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.length > 0 ? value : undefined;
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
