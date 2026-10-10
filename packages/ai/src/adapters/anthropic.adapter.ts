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

import { createModel, extendAdapter } from '@tanstack/ai';
import { ANTHROPIC_MODELS, anthropicText, createAnthropicChat } from '@tanstack/ai-anthropic';

import type { GenerationOptions } from '../contracts/generation.ts';
import type { ModelDescriptor, ModelHandle, ModelId } from '../contracts/model.ts';
import { AiError, InvalidModelOptionsError } from '../contracts/errors.ts';
import type { ModelProviderPort } from '../ports/model-provider.ts';
import type { ChatClientPort } from '../ports/chat-client.ts';
import { type ProviderUsageObserver, toTanstackChatClient } from './tanstack-chat-client.ts';

/**
 * Registry id under which {@linkcode AnthropicModelProvider} self-registers.
 */
export const ANTHROPIC_PROVIDER_ID = 'anthropic' as const;

/**
 * Map per-turn {@linkcode GenerationOptions} to Anthropic's native request-body
 * keys. A reasoning tier maps to the modern `output_config: { effort }` control;
 * `'off'` uses the selected model's supported mode: Sonnet 5.5 uses
 * `between_tools`, Opus 5.5/Fable 5.1 retain mandatory adaptive thinking, and
 * legacy or otherwise unknown models keep the generic disabled-thinking mapping.
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
  model?: ModelId,
): Readonly<Record<string, unknown>> | undefined {
  const modelOptions: Record<string, unknown> = {};
  const effort = options.reasoningEffort;
  if (effort === 'off') {
    if (model === 'claude-sonnet-5-5') {
      modelOptions.thinking = { type: 'between_tools' };
    } else if (!hasMandatoryThinking(model)) {
      modelOptions.thinking = { type: 'disabled' };
    }
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
  model?: ModelId,
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
  if (!isCurrentClaude(model)) return;

  const reject = (message: string): never => {
    throw new InvalidModelOptionsError(ANTHROPIC_PROVIDER_ID, message);
  };
  const outputConfig = options.output_config;
  const effort = typeof outputConfig === 'object' && outputConfig !== null &&
      'effort' in outputConfig
    ? outputConfig.effort
    : options.effort;
  if (
    effort !== undefined && effort !== null &&
    (typeof effort !== 'string' || !['low', 'medium', 'high', 'xhigh', 'max'].includes(effort))
  ) reject('This model accepts output_config.effort low, medium, high, xhigh, max or null.');

  if (thinking !== undefined) {
    if (typeof thinking !== 'object' || thinking === null || !('type' in thinking)) {
      return reject('Use an omitted thinking field or an adaptive thinking object.');
    }
    const betweenTools = model === 'claude-sonnet-5-5' && thinking.type === 'between_tools';
    if (thinking.type !== 'adaptive' && !betweenTools) {
      reject('This model rejects disabled and manual thinking; use adaptive thinking.');
    }
    if ('budget_tokens' in thinking) reject('Adaptive thinking does not accept a manual budget.');
    if (
      betweenTools &&
      (effort === 'xhigh' || effort === 'max' || Object.keys(thinking).length !== 1)
    ) reject('Sonnet between_tools accepts only type and requires high effort or below.');
  }

  const toolChoice = options.tool_choice;
  const toolType = typeof toolChoice === 'string'
    ? toolChoice
    : typeof toolChoice === 'object' && toolChoice !== null && 'type' in toolChoice
    ? toolChoice.type
    : undefined;
  if (toolChoice !== undefined && toolType !== 'auto' && toolType !== 'none') {
    reject('This model accepts only auto or none tool_choice.');
  }
  if (options.top_k !== undefined) reject('This model requires omitted top_k.');
  for (const [key, defaultValue] of [['temperature', 1], ['top_p', 1]] as const) {
    if (options[key] !== undefined && options[key] !== defaultValue) {
      reject('This model requires omitted or default sampling parameters.');
    }
  }
}

function hasMandatoryThinking(model: ModelId | undefined): boolean {
  return model === 'claude-opus-5-5' || model === 'claude-fable-5-1';
}

function isCurrentClaude(model: ModelId | undefined): boolean {
  return hasMandatoryThinking(model) || model === 'claude-sonnet-5-5';
}

/**
 * Configuration for {@linkcode AnthropicModelProvider}.
 *
 * All fields are optional: when `apiKey` is omitted the wrapped TanStack client
 * checks `ANTHROPIC_AUTH_TOKEN`, then `ANTHROPIC_OAUTH_TOKEN`, then
 * `ANTHROPIC_API_KEY` when the stream starts. Explicit request/provider keys win.
 */
export interface AnthropicModelProviderConfig {
  /** Anthropic credential. When omitted, uses the wrapped client's environment fallback. */
  readonly apiKey?: string;
  /** Override the API base URL (e.g. to route through a gateway/proxy). */
  readonly baseURL?: string;
  /**
   * Explicit additional API model IDs, merged with the bundled catalog.
   * Discovery and construction stay offline; an ID alone supplies no unknown
   * capabilities or token limits. The provider snapshots and deduplicates IDs.
   */
  readonly models?: readonly string[];
}

const INPUT_MODALITIES = ['text', 'image', 'document'] as const;

// The API serves Sonnet 5.5 before the wrapped adapter's catalog includes it.
// Use TanStack's model extension seam to pass this exact id to the native SDK.
const BUNDLED_MODEL_IDS = [...ANTHROPIC_MODELS, 'claude-sonnet-5-5'];

/**
 * A {@linkcode ModelProviderPort} backed by `@tanstack/ai-anthropic`.
 *
 * The model catalog combines the wrapped package's `ANTHROPIC_MODELS` with
 * Sonnet 5.5 and explicitly configured API IDs through TanStack's public
 * model extension seam. Additional IDs do not imply capability metadata.
 * Streaming clients created by
 * {@linkcode AnthropicModelProvider.createChatClient} are cancelled by passing
 * an `AbortController` to the TanStack `chat()` / `chatStream()` call — the
 * documented stop path for long-lived streams (F-13).
 *
 * @example Register and resolve a model
 * ```ts
 * import '@netscript/ai/anthropic'; // self-registers the provider
 * import { getModel } from '@netscript/ai';
 *
 * const handle = await getModel('anthropic:claude-sonnet-5-5');
 * ```
 */
export class AnthropicModelProvider implements ModelProviderPort {
  /** Stable registry id (`"anthropic"`). */
  readonly id: string = ANTHROPIC_PROVIDER_ID;
  readonly #config: AnthropicModelProviderConfig;
  readonly #modelIds: readonly string[];

  /** Construct a provider bound to the given `config` (defaults to `{}`). */
  constructor(config: AnthropicModelProviderConfig = {}) {
    if (
      config.models !== undefined &&
      (!Array.isArray(config.models) ||
        Array.from(config.models).some((id) =>
          typeof id !== 'string' || id.length === 0 || id.trim() !== id
        ))
    ) {
      throw new AiError('Anthropic models must be an array of non-empty, unpadded API model IDs.');
    }
    this.#config = { ...config };
    this.#modelIds = [...new Set([...BUNDLED_MODEL_IDS, ...(config.models ?? [])])];
  }

  /**
   * List the bundled catalog plus this provider's explicit additional IDs.
   */
  listModels(): Promise<readonly ModelDescriptor[]> {
    return Promise.resolve(this.#modelIds.map((id) => describeAnthropicModel(id)));
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
    return this.#modelIds.includes(modelId);
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
   * const client = provider.createChatClient('claude-sonnet-5-5');
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
    const resolved = this.#modelIds.find((candidate) => candidate === model);
    if (resolved === undefined) {
      throw new AiError(
        `Model "${model}" is not offered by the "${ANTHROPIC_PROVIDER_ID}" provider.`,
      );
    }
    const models = this.#modelIds.map((id) =>
      createModel(id, BUNDLED_MODEL_IDS.includes(id) ? INPUT_MODALITIES : ['text'] as const)
    );
    const anthropicTextWithModels = extendAdapter(anthropicText, models);
    const createAnthropicChatWithModels = extendAdapter(createAnthropicChat, models);
    return toTanstackChatClient((connection) => {
      const apiKey = nonEmpty(connection?.apiKey) ?? nonEmpty(this.#config.apiKey);
      const baseURL = nonEmpty(connection?.baseURL) ?? nonEmpty(this.#config.baseURL);
      const clientConfig = baseURL === undefined ? undefined : { baseURL };
      return apiKey === undefined
        ? anthropicTextWithModels(resolved, clientConfig)
        : createAnthropicChatWithModels(resolved, apiKey, clientConfig);
    }, {
      name: ANTHROPIC_PROVIDER_ID,
      kind: 'text',
      mapModelOptions: (options) => anthropicGenerationModelOptions(options, resolved),
      validateModelOptions: (options) => validateAnthropicModelOptions(options, resolved),
      createUsageObserver: createAnthropicUsageObserver,
    });
  }
}

/** Preserve cumulative Messages usage spanning message_start and message_delta. */
function createAnthropicUsageObserver(): ProviderUsageObserver {
  const counts: Record<string, number> = {};
  const serverCounts: Record<string, number> = {};
  const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
  const recordCounts = (
    source: Readonly<Record<string, unknown>>,
    keys: readonly string[],
    target: Record<string, number>,
  ): void => {
    for (const key of keys) {
      const count = source[key];
      if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) {
        target[key] = count;
      }
    }
  };
  return {
    observe(frame) {
      if (!isRecord(frame)) return;
      const reported = frame.type === 'message_start' && isRecord(frame.message)
        ? frame.message.usage
        : frame.type === 'message_delta'
        ? frame.usage
        : undefined;
      if (!isRecord(reported)) return;
      // Deltas are cumulative snapshots, not increments. Later reported
      // fields replace earlier ones; omitted input/cache fields retain start.
      recordCounts(reported, [
        'input_tokens',
        'output_tokens',
        'cache_creation_input_tokens',
        'cache_read_input_tokens',
      ], counts);
      if (isRecord(reported.server_tool_use)) {
        recordCounts(reported.server_tool_use, [
          'web_search_requests',
          'web_fetch_requests',
        ], serverCounts);
      }
    },
    read() {
      if (Object.keys(counts).length === 0) return undefined;
      // Messages input_tokens excludes cache reads/writes. The owned total
      // input contract follows TanStack 0.21 and includes both exactly once.
      const promptTokens = (counts.input_tokens ?? 0) +
        (counts.cache_read_input_tokens ?? 0) + (counts.cache_creation_input_tokens ?? 0);
      const completionTokens = counts.output_tokens ?? 0;
      const promptTokensDetails = {
        ...(counts.cache_creation_input_tokens !== undefined &&
          { cacheWriteTokens: counts.cache_creation_input_tokens }),
        ...(counts.cache_read_input_tokens !== undefined &&
          { cachedTokens: counts.cache_read_input_tokens }),
      };
      const serverToolUse = {
        ...(serverCounts.web_search_requests !== undefined &&
          { webSearchRequests: serverCounts.web_search_requests }),
        ...(serverCounts.web_fetch_requests !== undefined &&
          { webFetchRequests: serverCounts.web_fetch_requests }),
      };
      return {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        ...(Object.keys(promptTokensDetails).length > 0 && { promptTokensDetails }),
        ...(Object.keys(serverToolUse).length > 0 &&
          { providerUsageDetails: { serverToolUse } }),
      };
    },
  };
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
    capabilities: BUNDLED_MODEL_IDS.includes(id)
      ? {
        streaming: true,
        tools: true,
        vision: true,
        inputModalities: INPUT_MODALITIES,
      }
      : undefined,
  };
}
