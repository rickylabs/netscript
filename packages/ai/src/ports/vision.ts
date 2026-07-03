/**
 * Vision provider port.
 *
 * Default is a throwing "unconfigured" port — image understanding requires an
 * explicit adapter (slice E7).
 *
 * @module
 */

import type { ContentSource } from '../contracts/content.ts';
import type { Usage } from '../contracts/usage.ts';
import { AiError, AiNotConfiguredError } from '../contracts/errors.ts';

/** Per-call options for {@linkcode VisionProviderPort.analyze}. */
export interface VisionCallOptions {
  /** Vision-capable model id; adapters may use their configured default when omitted. */
  readonly model?: string;
  /** Cancellation signal forwarded to the provider request. */
  readonly signal?: AbortSignal;
}

/** The textual result of a vision analysis. */
export interface VisionResponse {
  /** The model's textual answer. */
  readonly text: string;
  /** Token usage for the request, when reported. */
  readonly usage?: Usage;
}

/** Opaque, provider-defined configuration bag passed to a vision factory. */
export type VisionProviderConfig = Readonly<Record<string, unknown>>;

/** Factory registered by provider packages via {@linkcode registerVisionProvider}. */
export type VisionProviderFactory = (config?: VisionProviderConfig) => VisionProviderPort;

/** Raised when a vision provider id cannot be resolved from the registry. */
export class VisionProviderNotFoundError extends AiError {
  /** The unresolved provider id. */
  readonly providerId: string;
  /** Ids of providers that were registered at throw time. */
  readonly availableProviders: readonly string[];

  /** Construct the error for an unresolved vision `providerId`. */
  constructor(providerId: string, availableProviders: readonly string[]) {
    super(
      `No vision provider registered for id "${providerId}". ` +
        `Registered providers: [${availableProviders.join(', ')}].`,
    );
    this.name = 'VisionProviderNotFoundError';
    this.providerId = providerId;
    this.availableProviders = availableProviders;
  }
}

/**
 * The vision capability seam.
 */
export interface VisionProviderPort {
  /** Analyze an image with a guiding prompt. */
  analyze(
    image: ContentSource,
    prompt: string,
    options?: VisionCallOptions,
  ): Promise<VisionResponse>;
}

const registry = new Map<string, VisionProviderFactory>();

/** Register a vision provider factory under an id. */
export function registerVisionProvider(id: string, factory: VisionProviderFactory): void {
  registry.set(id, factory);
}

/** Ids of all currently-registered vision providers. */
export function listVisionProviders(): readonly string[] {
  return [...registry.keys()];
}

/** Whether a vision provider id has been registered. */
export function isVisionProviderRegistered(id: string): boolean {
  return registry.has(id);
}

/** Clear the vision provider registry. Intended for test isolation. */
export function resetVisionRegistry(): void {
  registry.clear();
}

/**
 * Resolve a vision provider id to a fresh {@linkcode VisionProviderPort}.
 *
 * @throws {VisionProviderNotFoundError} When no factory is registered for `id`.
 */
export function getVisionProvider(id: string, config?: VisionProviderConfig): VisionProviderPort {
  const factory = registry.get(id);
  if (!factory) {
    throw new VisionProviderNotFoundError(id, [...registry.keys()]);
  }
  return factory(config);
}

/**
 * Create the default throwing vision provider. Every call rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredVisionProvider(): VisionProviderPort {
  return {
    analyze(): Promise<VisionResponse> {
      return Promise.reject(
        new AiNotConfiguredError('vision', 'Inject a VisionProviderPort via createAiRuntime.'),
      );
    },
  };
}
