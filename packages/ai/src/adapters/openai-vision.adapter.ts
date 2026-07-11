/**
 * OpenAI-compatible adapter for the dedicated vision capability.
 *
 * @module
 */

import type { ContentSource } from '../contracts/content.ts';
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';
import type { Usage } from '../contracts/usage.ts';
import type { VisionCallOptions, VisionProviderPort, VisionResponse } from '../ports/vision.ts';

/** Registry id used by the OpenAI-compatible vision provider. */
export const OPENAI_VISION_PROVIDER_ID = 'openai-compatible' as const;

/** Default vision-capable model used when no model override is supplied. */
export const DEFAULT_OPENAI_VISION_MODEL = 'gpt-4o-mini' as const;

/** Configuration for {@linkcode OpenAiVisionProvider}. */
export interface OpenAiVisionProviderConfig {
  /** Base URL of the OpenAI-compatible endpoint. */
  readonly baseURL?: string;
  /** API key sent as a bearer token. */
  readonly apiKey?: string;
  /** Default vision-capable chat model. */
  readonly model?: string;
  /** Fetch implementation, primarily for unit tests. */
  readonly fetch?: typeof fetch;
}

/** OpenAI-compatible implementation of the dedicated vision port. */
export class OpenAiVisionProvider implements VisionProviderPort {
  readonly #config: OpenAiVisionProviderConfig;

  /** Construct a provider bound to `config`. */
  constructor(config: OpenAiVisionProviderConfig = {}) {
    this.#config = config;
  }

  /** Analyze one URL or inline base64 image through Chat Completions. */
  async analyze(
    image: ContentSource,
    prompt: string,
    options: VisionCallOptions = {},
  ): Promise<VisionResponse> {
    const apiKey = this.#config.apiKey;
    if (apiKey === undefined || apiKey.length === 0) {
      throw new AiNotConfiguredError(
        OPENAI_VISION_PROVIDER_ID,
        'Provide `apiKey` to call an OpenAI-compatible endpoint.',
      );
    }

    const model = options.model ?? this.#config.model ?? DEFAULT_OPENAI_VISION_MODEL;
    const request = this.#config.fetch ?? fetch;
    const response = await request(endpoint(this.#config.baseURL), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl(image) } },
          ],
        }],
      }),
      signal: options.signal,
    });
    const payload = parseJson(await response.text());
    if (!response.ok) {
      throw providerError(response.status, payload);
    }
    return parseResponse(payload);
  }
}

function endpoint(baseURL: string | undefined): string {
  return `${(baseURL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;
}

function imageUrl(source: ContentSource): string {
  return source.type === 'url' ? source.value : `data:${source.mimeType};base64,${source.value}`;
}

function parseJson(text: string): unknown {
  if (text.length === 0) return {};
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new AiError('OpenAI-compatible vision provider returned invalid JSON.', { cause });
  }
}

function providerError(status: number, payload: unknown): AiError {
  const fallback = `OpenAI-compatible vision request failed with HTTP ${status}.`;
  if (!isRecord(payload) || !isRecord(payload.error)) return new AiError(fallback);
  return new AiError(typeof payload.error.message === 'string' ? payload.error.message : fallback);
}

function parseResponse(payload: unknown): VisionResponse {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new AiError('OpenAI-compatible vision response was malformed: missing choices array.');
  }
  const first = payload.choices[0];
  if (!isRecord(first) || !isRecord(first.message) || typeof first.message.content !== 'string') {
    throw new AiError('OpenAI-compatible vision response was malformed: missing message content.');
  }
  return { text: first.message.content, usage: parseUsage(payload.usage) };
}

function parseUsage(value: unknown): Usage | undefined {
  if (!isRecord(value)) return undefined;
  const promptTokens = numberField(value, 'prompt_tokens') ?? numberField(value, 'input_tokens') ??
    0;
  const completionTokens = numberField(value, 'completion_tokens') ??
    numberField(value, 'output_tokens') ?? 0;
  const totalTokens = numberField(value, 'total_tokens') ?? promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  return typeof record[key] === 'number' ? record[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
