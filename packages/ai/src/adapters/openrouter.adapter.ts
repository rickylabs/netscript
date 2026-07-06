/**
 * OpenRouter model-provider adapter — wraps `@tanstack/ai-openai/compatible`.
 *
 * OpenRouter speaks the OpenAI-compatible Chat Completions wire, so this adapter
 * reuses the same TanStack OpenAI-compatible transport as
 * {@linkcode import('./openai-compatible.adapter.ts').OpenAiCompatibleModelProvider}
 * — pointed at `https://openrouter.ai/api/v1` — rather than taking a dedicated
 * OpenRouter SDK dependency. The one wire divergence is **reasoning**: OpenRouter
 * expects a top-level `reasoning: { effort }` object (not OpenAI's
 * `reasoning_effort`, not Anthropic's `thinking`). {@linkcode openRouterReasoningModelOptions}
 * normalizes an owned {@linkcode ReasoningEffort} to that shape and threads it
 * through the TanStack `modelOptions` passthrough.
 *
 * Registered into the shared model registry by the `@netscript/ai/openrouter`
 * subpath entrypoint; this file holds the implementation and takes the provider
 * SDK dependency, keeping the base `@netscript/ai` entrypoint free of it.
 *
 * @module
 */

import { openaiCompatible } from '@tanstack/ai-openai/compatible';

import type { GenerationOptions, ReasoningEffort } from '../contracts/generation.ts';
import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import { toTanstackChatClient } from './tanstack-chat-client.ts';

export type { ReasoningEffort } from '../contracts/generation.ts';

/**
 * Registry id under which {@linkcode OpenRouterModelProvider} self-registers.
 */
export const OPENROUTER_PROVIDER_ID = 'openrouter' as const;

/**
 * Default OpenRouter OpenAI-compatible base URL.
 */
export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1' as const;

/**
 * Environment variable OpenRouter reads for its API key when `apiKey` is omitted
 * (per-provider BYOK resolution).
 */
export const OPENROUTER_API_KEY_ENV = 'OPENROUTER_API_KEY' as const;

const DEFAULT_INPUT_MODALITIES = ['text', 'image'] as const;

/**
 * Configuration for {@linkcode OpenRouterModelProvider}.
 *
 * `apiKey` falls back to the `OPENROUTER_API_KEY` environment variable when
 * omitted; `baseURL` defaults to {@linkcode DEFAULT_OPENROUTER_BASE_URL}. A
 * provider may be registered without a key (it still lists/reports its
 * `models`), but {@linkcode OpenRouterModelProvider.createChatClient} then
 * rejects with {@linkcode AiNotConfiguredError}.
 */
export interface OpenRouterModelProviderConfig {
  /** OpenRouter API key. Falls back to `OPENROUTER_API_KEY` when omitted. */
  readonly apiKey?: string;
  /** Override the base URL (defaults to `https://openrouter.ai/api/v1`). */
  readonly baseURL?: string;
  /** Model ids to expose. Drives `listModels` / `supports`. */
  readonly models?: readonly string[];
  /** Reasoning effort emitted as OpenRouter's `reasoning: { effort }`. */
  readonly reasoningEffort?: ReasoningEffort;
}

/**
 * Normalize an owned {@linkcode ReasoningEffort} to OpenRouter's request-body
 * reasoning shape, or `undefined` when no effort is set.
 *
 * OpenRouter expects a **top-level** `reasoning` object — distinct from OpenAI's
 * flat `reasoning_effort` and Anthropic's `thinking`/`output_config`. A tier maps
 * to `{ reasoning: { effort } }`; `'off'` explicitly disables reasoning via
 * `{ reasoning: { enabled: false } }`. This is a pure function so the exact wire
 * shape is unit-testable.
 *
 * @example
 * ```ts
 * openRouterReasoningModelOptions('high'); // { reasoning: { effort: 'high' } }
 * openRouterReasoningModelOptions('off'); // { reasoning: { enabled: false } }
 * openRouterReasoningModelOptions(undefined); // undefined
 * ```
 */
export function openRouterReasoningModelOptions(
  effort: ReasoningEffort | undefined,
): { readonly reasoning: Readonly<Record<string, unknown>> } | undefined {
  if (effort === undefined) {
    return undefined;
  }
  if (effort === 'off') {
    return { reasoning: { enabled: false } };
  }
  return { reasoning: { effort } };
}

/**
 * Map per-turn {@linkcode GenerationOptions} to OpenRouter's native request-body
 * keys: reasoning via {@linkcode openRouterReasoningModelOptions} (top-level
 * `reasoning`) and `maxOutputTokens` via `max_tokens`. Returns `undefined` when
 * the options carry nothing OpenRouter models. Pure and unit-testable; the
 * caller's `providerOptions` escape hatch is merged separately by the bridge.
 */
export function openRouterGenerationModelOptions(
  options: GenerationOptions,
): Readonly<Record<string, unknown>> | undefined {
  const modelOptions: Record<string, unknown> = {};
  const reasoning = openRouterReasoningModelOptions(options.reasoningEffort);
  if (reasoning !== undefined) {
    Object.assign(modelOptions, reasoning);
  }
  if (options.maxOutputTokens !== undefined) {
    modelOptions.max_tokens = options.maxOutputTokens;
  }
  return Object.keys(modelOptions).length > 0 ? modelOptions : undefined;
}

/**
 * A {@linkcode ModelProviderPort} backed by `@tanstack/ai-openai/compatible`,
 * pinned to the OpenRouter endpoint with its reasoning-shape override.
 *
 * Like the OpenAI-compatible provider there is no fixed catalog: models come
 * from {@linkcode OpenRouterModelProviderConfig.models}. When none are
 * configured the provider is optimistic (`supports` returns `true`).
 *
 * @example Register and stream a reasoning turn
 * ```ts
 * import '@netscript/ai/openrouter'; // self-registers the provider
 * import { getModelProvider } from '@netscript/ai';
 *
 * const provider = getModelProvider('openrouter', {
 *   apiKey: Deno.env.get('OPENROUTER_API_KEY'),
 *   models: ['anthropic/claude-sonnet-4.5'],
 *   reasoningEffort: 'high',
 * });
 * ```
 */
export class OpenRouterModelProvider implements ModelProviderPort {
  /** Stable registry id (`"openrouter"`). */
  readonly id: string = OPENROUTER_PROVIDER_ID;
  readonly #config: OpenRouterModelProviderConfig;

  /** Construct a provider bound to the given `config` (defaults to `{}`). */
  constructor(config: OpenRouterModelProviderConfig = {}) {
    this.#config = config;
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
          `Model "${modelId}" is not offered by the "${OPENROUTER_PROVIDER_ID}" provider.`,
        ),
      );
    }
    return Promise.resolve({ providerId: this.id, descriptor: this.#describe(modelId) });
  }

  /**
   * Whether the provider offers `modelId`. Optimistically `true` when no
   * `models` are configured (OpenRouter owns its catalog).
   */
  supports(modelId: ModelId): boolean {
    const models = this.#config.models;
    return models === undefined || models.length === 0 ? true : models.includes(modelId);
  }

  /**
   * Construct an owned {@linkcode ChatClientPort} for `model`.
   *
   * Resolves the API key from config or the `OPENROUTER_API_KEY` environment
   * variable, builds the TanStack OpenAI-compatible adapter against the
   * OpenRouter base URL, and threads the normalized reasoning shape through
   * `modelOptions`. Per-turn cancellation flows through the port's
   * `stream(_, { signal })` option (F-13).
   *
   * @param model - A model id OpenRouter exposes.
   * @throws {AiNotConfiguredError} When no API key is available.
   */
  createChatClient(model: ModelId): ChatClientPort {
    const { baseURL, models, reasoningEffort } = this.#config;
    const apiKey = resolveOpenRouterKey(this.#config.apiKey);
    if (apiKey === undefined) {
      throw new AiNotConfiguredError(
        OPENROUTER_PROVIDER_ID,
        `Provide \`apiKey\` or set ${OPENROUTER_API_KEY_ENV} to construct a client.`,
      );
    }
    const factory = openaiCompatible({
      name: OPENROUTER_PROVIDER_ID,
      baseURL: baseURL ?? DEFAULT_OPENROUTER_BASE_URL,
      apiKey,
      models: models ?? [model],
    });
    const adapter = factory(model);
    return toTanstackChatClient(adapter, {
      name: OPENROUTER_PROVIDER_ID,
      kind: 'text',
      modelOptions: openRouterReasoningModelOptions(reasoningEffort),
      mapModelOptions: openRouterGenerationModelOptions,
    });
  }

  /** Build the {@linkcode ModelDescriptor} for a model id. */
  #describe(id: string): ModelDescriptor {
    return {
      id,
      provider: OPENROUTER_PROVIDER_ID,
      displayName: id,
      capabilities: {
        streaming: true,
        tools: true,
        inputModalities: DEFAULT_INPUT_MODALITIES,
      },
    };
  }
}

/** Resolve the OpenRouter key from config, else the `OPENROUTER_API_KEY` env. */
function resolveOpenRouterKey(configKey: string | undefined): string | undefined {
  if (configKey !== undefined && configKey.length > 0) {
    return configKey;
  }
  return readEnv(OPENROUTER_API_KEY_ENV);
}

/** Read an environment variable, tolerating a missing `Deno`/`--allow-env`. */
function readEnv(name: string): string | undefined {
  try {
    return typeof Deno !== 'undefined' ? Deno.env.get(name) : undefined;
  } catch {
    return undefined;
  }
}
