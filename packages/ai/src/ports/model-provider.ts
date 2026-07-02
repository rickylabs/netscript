/**
 * Model provider port and the global model registry.
 *
 * This is the AI stack's analogue of `@netscript/kv`'s adapter registry
 * (`registerKvAdapter` + the `getKv()` singleton). Provider packages (E2 —
 * `@netscript/ai-anthropic`, `@netscript/ai-openai`, …) **self-register** their
 * factory as a side effect of being imported:
 *
 * ```ts
 * // In @netscript/ai-anthropic/mod.ts (self-registration on import):
 * import { registerModelProvider } from '@netscript/ai';
 * registerModelProvider('anthropic', (config) => new AnthropicProvider(config));
 * ```
 *
 * Nothing in this core imports a provider, so no provider SDK enters the module
 * graph until an app opts in by importing the provider package.
 *
 * @module
 */

import type { ModelDescriptor, ModelHandle, ModelId, ModelRef, ModelSelector } from '../contracts/model.ts';
import { InvalidModelRefError, ModelProviderNotFoundError } from '../contracts/errors.ts';

/**
 * A concrete model backend. Implemented by E2 provider adapters; this core
 * ships no implementation. Methods are async so adapters may perform discovery.
 */
export interface ModelProviderPort {
  /** Stable registry id (e.g. `anthropic`). */
  readonly id: string;
  /** List the models this provider exposes. */
  listModels(): Promise<readonly ModelDescriptor[]>;
  /** Resolve one model to a handle, or reject if unknown. */
  getModel(modelId: ModelId): Promise<ModelHandle>;
  /** Cheap synchronous capability probe. */
  supports(modelId: ModelId): boolean;
}

/**
 * Opaque, provider-defined configuration bag passed to a provider factory.
 */
export type ModelProviderConfig = Readonly<Record<string, unknown>>;

/**
 * Factory that constructs a {@linkcode ModelProviderPort}. Registered by
 * provider packages via {@linkcode registerModelProvider}.
 */
export type ModelProviderFactory = (config?: ModelProviderConfig) => ModelProviderPort;

// ---------------------------------------------------------------------------
// Registry — module-level singleton (single source of truth). Mirrors the
// KV adapter registry: a Map of provider id -> factory.
// ---------------------------------------------------------------------------
const registry = new Map<string, ModelProviderFactory>();

/**
 * Register a provider factory under an id. Called as an import side effect by
 * provider packages. Re-registering an id overwrites the previous factory.
 */
export function registerModelProvider(id: string, factory: ModelProviderFactory): void {
  registry.set(id, factory);
}

/**
 * Ids of all currently-registered providers.
 */
export function listModelProviders(): readonly string[] {
  return [...registry.keys()];
}

/**
 * Whether a provider id has been registered.
 */
export function isModelProviderRegistered(id: string): boolean {
  return registry.has(id);
}

/**
 * Clear the registry. Intended for test isolation.
 */
export function resetModelRegistry(): void {
  registry.clear();
}

/**
 * Resolve a provider id to a fresh {@linkcode ModelProviderPort} instance.
 *
 * @throws {ModelProviderNotFoundError} When no factory is registered for `id`.
 */
export function getModelProvider(id: string, config?: ModelProviderConfig): ModelProviderPort {
  const factory = registry.get(id);
  if (!factory) {
    throw new ModelProviderNotFoundError(id, [...registry.keys()]);
  }
  return factory(config);
}

/**
 * Parse a {@linkcode ModelRef} into a structured {@linkcode ModelSelector}.
 *
 * @throws {InvalidModelRefError} When a string ref is not `"<provider>:<model>"`.
 */
export function parseModelRef(ref: ModelRef): ModelSelector {
  if (typeof ref !== 'string') {
    return ref;
  }
  const separator = ref.indexOf(':');
  if (separator <= 0 || separator === ref.length - 1) {
    throw new InvalidModelRefError(ref);
  }
  return { provider: ref.slice(0, separator), model: ref.slice(separator + 1) };
}

/**
 * Resolve a model reference end-to-end: parse the ref, resolve its provider
 * from the registry, and ask the provider for the model handle.
 *
 * @throws {InvalidModelRefError} When the ref string is malformed.
 * @throws {ModelProviderNotFoundError} When the provider is not registered.
 */
export function getModel(ref: ModelRef, config?: ModelProviderConfig): Promise<ModelHandle> {
  const { provider, model } = parseModelRef(ref);
  return getModelProvider(provider, config).getModel(model);
}
