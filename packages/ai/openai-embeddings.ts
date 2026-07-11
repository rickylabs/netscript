/**
 * OpenAI-compatible embeddings provider entrypoint for `@netscript/ai`.
 *
 * Importing this module self-registers the `'openai-embeddings'` provider for
 * the embedding capability, mirroring `@netscript/kv/redis`.
 *
 * ```ts
 * import '@netscript/ai/openai-embeddings';
 * ```
 *
 * @module
 */

import type { EmbeddingProviderConfig } from './src/ports/embedding.ts';
import { registerEmbeddingProvider } from './src/ports/embedding.ts';
import {
  OPENAI_EMBEDDINGS_PROVIDER_ID,
  OpenAiEmbeddingsProvider,
  type OpenAiEmbeddingsProviderConfig,
} from './src/adapters/openai-embeddings.adapter.ts';

/** Narrow an opaque registry config bag to the OpenAI-compatible E6 config. */
function readOpenAiEmbeddingsConfig(
  config?: EmbeddingProviderConfig,
): OpenAiEmbeddingsProviderConfig {
  return {
    apiKey: typeof config?.apiKey === 'string' ? config.apiKey : undefined,
    baseURL: typeof config?.baseURL === 'string' ? config.baseURL : undefined,
    embeddingModel: typeof config?.embeddingModel === 'string' ? config.embeddingModel : undefined,
    fetch: isFetch(config?.fetch) ? config.fetch : undefined,
  };
}

function isFetch(value: unknown): value is typeof fetch {
  return typeof value === 'function';
}

registerEmbeddingProvider(
  OPENAI_EMBEDDINGS_PROVIDER_ID,
  (config) => new OpenAiEmbeddingsProvider(readOpenAiEmbeddingsConfig(config)),
);
export {
  DEFAULT_OPENAI_EMBEDDING_MODEL,
  OPENAI_EMBEDDINGS_PROVIDER_ID,
  OpenAiEmbeddingsProvider,
} from './src/adapters/openai-embeddings.adapter.ts';
export type {
  ContentSource,
  DataContentSource,
  UrlContentSource,
} from './src/contracts/content.ts';
export type {
  CompletionTokensDetails,
  PromptTokensDetails,
  ProviderUsageDetails,
  Usage,
  UsageCostBreakdown,
} from './src/contracts/usage.ts';
export type { OpenAiEmbeddingsProviderConfig } from './src/adapters/openai-embeddings.adapter.ts';
export type {
  EmbeddingCallOptions,
  EmbeddingProviderPort,
  EmbeddingResponse,
} from './src/ports/embedding.ts';
