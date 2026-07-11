/**
 * OpenAI-compatible embeddings adapter.
 *
 * This adapter speaks the OpenAI-compatible HTTP API directly with Web
 * `fetch`, keeping the optional provider dependency graph out of the core
 * entrypoint. It implements the E6 embeddings port and is registered by the
 * `@netscript/ai/openai-embeddings` subpath.
 *
 * @module
 */

import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';
import type { Usage } from '../contracts/usage.ts';
import type {
  EmbeddingCallOptions,
  EmbeddingProviderPort,
  EmbeddingResponse,
} from '../ports/embedding.ts';

/** Registry id under which the OpenAI-compatible E6 provider self-registers. */
export const OPENAI_EMBEDDINGS_PROVIDER_ID = 'openai-embeddings' as const;

/** Default OpenAI embeddings model used when neither config nor call options specify one. */
export const DEFAULT_OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small' as const;

/** Configuration for {@linkcode OpenAiEmbeddingsProvider}. */
export interface OpenAiEmbeddingsProviderConfig {
  /** Base URL of the OpenAI-compatible endpoint. */
  readonly baseURL?: string;
  /** API key sent as a bearer token. */
  readonly apiKey?: string;
  /** Default embedding model. */
  readonly embeddingModel?: string;
  /** Fetch implementation, primarily for unit tests. */
  readonly fetch?: typeof fetch;
}

/**
 * OpenAI-compatible adapter implementing both embedding and vision ports.
 *
 * @example
 * ```ts
 * const provider = new OpenAiEmbeddingsProvider({ apiKey });
 * const result = await provider.embed('hello');
 * ```
 */
export class OpenAiEmbeddingsProvider implements EmbeddingProviderPort {
  readonly #config: OpenAiEmbeddingsProviderConfig;

  /** Construct a provider bound to the given `config`. */
  constructor(config: OpenAiEmbeddingsProviderConfig = {}) {
    this.#config = config;
  }

  /**
   * Embed one or more strings through `/embeddings`.
   *
   * @param input - One input string or a batch of strings.
   * @param options - Optional model override and cancellation signal.
   * @returns Embedding vectors in input order.
   */
  async embed(
    input: string | readonly string[],
    options: EmbeddingCallOptions = {},
  ): Promise<EmbeddingResponse> {
    const model = options.model ?? this.#config.embeddingModel ?? DEFAULT_OPENAI_EMBEDDING_MODEL;
    const payload = await this.#postJson('/embeddings', {
      model,
      input,
    }, options.signal);
    return parseEmbeddingResponse(payload, model);
  }

  async #postJson(
    path: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { apiKey } = this.#config;
    if (apiKey === undefined || apiKey.length === 0) {
      throw new AiNotConfiguredError(
        OPENAI_EMBEDDINGS_PROVIDER_ID,
        'Provide `apiKey` to call an OpenAI-compatible endpoint.',
      );
    }
    const request = this.#config.fetch ?? fetch;
    const response = await request(endpoint(this.#config.baseURL, path), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
    const text = await response.text();
    const payload = parseJson(text);
    if (!response.ok) {
      throw providerError(response.status, payload);
    }
    return payload;
  }
}

function endpoint(baseURL: string | undefined, path: string): string {
  const base = baseURL ?? 'https://api.openai.com/v1';
  return `${base.replace(/\/+$/, '')}${path}`;
}

function parseJson(text: string): unknown {
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new AiError('OpenAI-compatible provider returned invalid JSON.', { cause });
  }
}

function providerError(status: number, payload: unknown): AiError {
  const fallback = `OpenAI-compatible provider request failed with HTTP ${status}.`;
  if (!isRecord(payload)) {
    return new AiError(fallback);
  }
  const error = payload.error;
  if (!isRecord(error)) {
    return new AiError(fallback);
  }
  const message = typeof error.message === 'string' ? error.message : fallback;
  return new AiError(message);
}

function parseEmbeddingResponse(payload: unknown, fallbackModel: string): EmbeddingResponse {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new AiError('OpenAI-compatible embeddings response was malformed: missing data array.');
  }
  const entries = payload.data.map(parseEmbeddingEntry).sort((a, b) => a.index - b.index);
  return {
    embeddings: entries.map((entry) => entry.embedding),
    model: typeof payload.model === 'string' ? payload.model : fallbackModel,
    usage: parseUsage(payload.usage),
  };
}

function parseEmbeddingEntry(
  value: unknown,
): { readonly index: number; readonly embedding: readonly number[] } {
  if (!isRecord(value) || typeof value.index !== 'number' || !isNumberArray(value.embedding)) {
    throw new AiError('OpenAI-compatible embeddings response was malformed: invalid vector entry.');
  }
  return { index: value.index, embedding: value.embedding };
}

function parseUsage(value: unknown): Usage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const promptTokens = numberField(value, 'prompt_tokens') ?? numberField(value, 'input_tokens') ??
    0;
  const completionTokens = numberField(value, 'completion_tokens') ??
    numberField(value, 'output_tokens') ?? 0;
  const totalTokens = numberField(value, 'total_tokens') ?? promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number');
}
