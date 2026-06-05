import type { PluginManifest } from '../config/mod.ts';
import { DuplicatePluginError } from '../domain/mod.ts';

/** Registry for loaded plugin manifests. */
export class PluginRegistry {
  readonly #plugins = new Map<string, PluginManifest>();

  /** Register a plugin manifest by name. */
  register(plugin: PluginManifest): void {
    if (this.#plugins.has(plugin.name)) {
      throw new DuplicatePluginError(plugin.name);
    }
    this.#plugins.set(plugin.name, plugin);
  }

  /** Resolve a plugin manifest by name. */
  resolve(name: string): PluginManifest | undefined {
    return this.#plugins.get(name);
  }

  /** List plugin manifests in registration order. */
  list(): readonly PluginManifest[] {
    return [...this.#plugins.values()];
  }
}
