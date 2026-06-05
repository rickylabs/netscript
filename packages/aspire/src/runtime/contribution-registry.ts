import { DuplicateContributionError } from '../domain/mod.ts';
import type { AspireNSPluginContribution } from './aspire-ns-plugin-contribution.base.ts';

/** Registry of Aspire plugin contributions for one AppHost composition. */
export class ContributionRegistry {
  readonly #items = new Map<string, AspireNSPluginContribution>();

  /**
   * Register a contribution by plugin name.
   *
   * @param contribution - Contribution instance to register.
   * @returns Void.
   */
  register(contribution: AspireNSPluginContribution): void {
    if (this.#items.has(contribution.pluginName)) {
      throw new DuplicateContributionError(contribution.pluginName);
    }
    this.#items.set(contribution.pluginName, contribution);
  }

  /**
   * Resolve a contribution by plugin name.
   *
   * @param pluginName - Plugin name to resolve.
   * @returns The contribution, or undefined when not registered.
   */
  resolve(pluginName: string): AspireNSPluginContribution | undefined {
    return this.#items.get(pluginName);
  }

  /**
   * List registered contributions in insertion order.
   *
   * @returns Registered contribution instances.
   */
  list(): readonly AspireNSPluginContribution[] {
    return [...this.#items.values()];
  }
}
