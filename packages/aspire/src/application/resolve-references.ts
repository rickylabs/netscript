/**
 * @module
 *
 * Resource reference extraction utilities.
 *
 * Extracts service references, plugin references, and infrastructure
 * dependency flags from config entries.
 */

import type { ResourceDependencies } from '../../types.ts';

/**
 * Extracts and deduplicates service references from a resource entry.
 *
 * @param entry - A config entry with optional service reference fields
 * @returns Deduplicated array of service reference names
 *
 * @example
 * ```ts
 * extractServiceReferences({ ServiceReferences: ['users', 'products', 'users'] });
 * // ['users', 'products']
 * ```
 */
export function extractServiceReferences(
  entry: {
    readonly ServiceReferences?: readonly string[];
  },
): string[] {
  const refs = new Set<string>();

  if (entry.ServiceReferences) {
    for (const ref of entry.ServiceReferences) {
      refs.add(ref);
    }
  }

  return [...refs];
}

/**
 * Extracts plugin references from a resource entry.
 *
 * @param entry - A config entry with optional plugin reference field
 * @returns Array of plugin reference names (empty if none)
 *
 * @example
 * ```ts
 * extractPluginReferences({ PluginReferences: ['workers-api', 'sagas-api'] });
 * // ['workers-api', 'sagas-api']
 * ```
 */
export function extractPluginReferences(
  entry: { readonly PluginReferences?: readonly string[] },
): string[] {
  return entry.PluginReferences ? [...entry.PluginReferences] : [];
}

/**
 * Extracts infrastructure dependency flags from a resource entry.
 *
 * Determines whether a resource requires database and/or KV store
 * connections, defaulting to `false` when not specified.
 *
 * @param entry - A config entry with optional dependency flags
 * @returns Normalized dependency requirements
 *
 * @example
 * ```ts
 * extractDependencies({ RequiresDb: true, RequiresKv: true });
 * // { requiresDb: true, requiresKv: true }
 *
 * extractDependencies({});
 * // { requiresDb: false, requiresKv: false }
 * ```
 */
export function extractDependencies(
  entry: { readonly RequiresDb?: boolean; readonly RequiresKv?: boolean },
): ResourceDependencies {
  return {
    requiresDb: entry.RequiresDb ?? false,
    requiresKv: entry.RequiresKv ?? false,
  };
}
