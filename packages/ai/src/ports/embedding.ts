/**
 * Embedding provider port.
 *
 * Default is a throwing "unconfigured" port — embeddings require an explicit
 * adapter (slice E6). Requesting an embedding from an unconfigured runtime
 * rejects with {@linkcode AiNotConfiguredError} rather than silently returning
 * empty vectors.
 *
 * @module
 */

import type { Usage } from '../contracts/usage.ts';
import { AiNotConfiguredError } from '../contracts/errors.ts';

/** A request to embed one or more inputs with a named model. */
export interface EmbeddingRequest {
  /** Embedding model id. */
  readonly model: string;
  /** One input string or a batch of them. */
  readonly input: string | readonly string[];
}

/** A single embedding vector, keyed by its position in the request. */
export interface EmbeddingVector {
  /** Index of the input this vector embeds. */
  readonly index: number;
  /** The dense embedding values. */
  readonly embedding: readonly number[];
}

/** The result of an embedding request. */
export interface EmbeddingResponse {
  /** Model that produced the vectors. */
  readonly model: string;
  /** One vector per input, in request order. */
  readonly vectors: readonly EmbeddingVector[];
  /** Token usage for the request, when reported. */
  readonly usage?: Usage;
}

/**
 * The embedding capability seam.
 */
export interface EmbeddingProviderPort {
  /** Embed one or more inputs. */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

/**
 * Create the default throwing embedding provider. Every call rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredEmbeddingProvider(): EmbeddingProviderPort {
  return {
    embed(): Promise<EmbeddingResponse> {
      return Promise.reject(
        new AiNotConfiguredError('embeddings', 'Inject an EmbeddingProviderPort via createAiRuntime.'),
      );
    },
  };
}
