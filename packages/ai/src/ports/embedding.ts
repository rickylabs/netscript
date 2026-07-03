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
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';

/** Per-call options for {@linkcode EmbeddingProviderPort.embed}. */
export interface EmbeddingCallOptions {
  /** Embedding model id; adapters may use their configured default when omitted. */
  readonly model?: string;
  /** Cancellation signal forwarded to the provider request. */
  readonly signal?: AbortSignal;
}

/** The result of an embedding request. */
export interface EmbeddingResponse {
  /** One dense embedding vector per input, in request order. */
  readonly embeddings: readonly (readonly number[])[];
  /** Model that produced the vectors. */
  readonly model: string;
  /** Token usage for the request, when reported. */
  readonly usage?: Usage;
}

/** Opaque, provider-defined configuration bag passed to an embedding factory. */
export type EmbeddingProviderConfig = Readonly<Record<string, unknown>>;

/** Factory registered by provider packages via {@linkcode registerEmbeddingProvider}. */
export type EmbeddingProviderFactory = (
  config?: EmbeddingProviderConfig,
) => EmbeddingProviderPort;

/** Raised when an embedding provider id cannot be resolved from the registry. */
export class EmbeddingProviderNotFoundError extends AiError {
  /** The unresolved provider id. */
  readonly providerId: string;
  /** Ids of providers that were registered at throw time. */
  readonly availableProviders: readonly string[];

  /** Construct the error for an unresolved embedding `providerId`. */
  constructor(providerId: string, availableProviders: readonly string[]) {
    super(
      `No embedding provider registered for id "${providerId}". ` +
        `Registered providers: [${availableProviders.join(', ')}].`,
    );
    this.name = 'EmbeddingProviderNotFoundError';
    this.providerId = providerId;
    this.availableProviders = availableProviders;
  }
}

/**
 * The embedding capability seam.
 */
export interface EmbeddingProviderPort {
  /** Embed one or more input strings. */
  embed(
    input: string | readonly string[],
    options?: EmbeddingCallOptions,
  ): Promise<EmbeddingResponse>;
}

const registry = new Map<string, EmbeddingProviderFactory>();

/** Register an embedding provider factory under an id. */
export function registerEmbeddingProvider(id: string, factory: EmbeddingProviderFactory): void {
  registry.set(id, factory);
}

/** Ids of all currently-registered embedding providers. */
export function listEmbeddingProviders(): readonly string[] {
  return [...registry.keys()];
}

/** Whether an embedding provider id has been registered. */
export function isEmbeddingProviderRegistered(id: string): boolean {
  return registry.has(id);
}

/** Clear the embedding provider registry. Intended for test isolation. */
export function resetEmbeddingRegistry(): void {
  registry.clear();
}

/**
 * Resolve an embedding provider id to a fresh {@linkcode EmbeddingProviderPort}.
 *
 * @throws {EmbeddingProviderNotFoundError} When no factory is registered for `id`.
 */
export function getEmbeddingProvider(
  id: string,
  config?: EmbeddingProviderConfig,
): EmbeddingProviderPort {
  const factory = registry.get(id);
  if (!factory) {
    throw new EmbeddingProviderNotFoundError(id, [...registry.keys()]);
  }
  return factory(config);
}

/**
 * Create the default throwing embedding provider. Every call rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredEmbeddingProvider(): EmbeddingProviderPort {
  return {
    embed(): Promise<EmbeddingResponse> {
      return Promise.reject(
        new AiNotConfiguredError(
          'embeddings',
          'Inject an EmbeddingProviderPort via createAiRuntime.',
        ),
      );
    },
  };
}
