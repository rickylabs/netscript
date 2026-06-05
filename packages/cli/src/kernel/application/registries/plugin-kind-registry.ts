/**
 * @module application/registries/plugin-kind-registry
 *
 * Read-only registry for CLI plugin kind providers.
 */

import { ScaffoldValidationError } from '../../domain/errors.ts';
import { apiKindProvider } from '../../adapters/plugin/kinds/plugin-kind-providers.ts';
import type { PluginKind, PluginKindProvider } from '../../domain/plugin-kind.ts';
import { Registry } from '../abstracts/registry.ts';

/** Ordered default plugin kind provider tuples. */
export const DEFAULT_PLUGIN_KIND_PROVIDERS: readonly (
  readonly [PluginKind, PluginKindProvider]
)[] = Object.freeze([
  ['api', apiKindProvider],
]);

/** Resolves day-1 plugin kinds to immutable scaffolding providers. */
export class PluginKindRegistry extends Registry<PluginKind, PluginKindProvider> {
  override readonly id = 'plugin-kinds';

  readonly #providers = new Map<PluginKind, PluginKindProvider>();

  constructor(
    providers: readonly (readonly [PluginKind, PluginKindProvider])[] =
      DEFAULT_PLUGIN_KIND_PROVIDERS,
  ) {
    super();
    for (const [kind, provider] of providers) {
      this.register(kind, provider);
    }
  }

  /** Register or replace a plugin kind provider. */
  override register(kind: PluginKind, provider: PluginKindProvider): void {
    this.#providers.set(kind, provider);
  }

  /** Resolve a plugin kind to its provider contract. */
  override get(kind: PluginKind): PluginKindProvider {
    const provider = this.#providers.get(kind);
    if (!provider) {
      throw new ScaffoldValidationError(`Unknown plugin kind "${kind}"`, {
        kind,
        supportedKinds: this.kinds(),
      });
    }

    return provider;
  }

  /** List registered providers in deterministic order. */
  override entries(): readonly (readonly [PluginKind, PluginKindProvider])[] {
    return [...this.#providers.entries()].sort(([left], [right]) => left.localeCompare(right));
  }

  /** Return the full read-only provider map. */
  getAll(): ReadonlyMap<PluginKind, PluginKindProvider> {
    return this.#providers;
  }

  /** Check whether a provider exists for the requested kind. */
  has(kind: PluginKind): boolean {
    return this.#providers.has(kind);
  }

  /** Enumerate all supported plugin kinds. */
  kinds(): readonly PluginKind[] {
    return [...this.#providers.keys()];
  }
}
