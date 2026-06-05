/**
 * @module
 *
 * Deno permission flag resolution for Aspire resources.
 *
 * Resolves the effective permission flags for a resource by merging
 * entry-level overrides with global defaults and optional watch flags.
 */

import { RESOURCE_DEFAULTS } from '../../constants.ts';

/**
 * Resolves the effective Deno permission flags for a resource.
 *
 * Resolution order:
 * 1. If the entry defines its own `Permissions`, those override the global defaults entirely
 * 2. Otherwise, the global default permissions are used
 * 3. If `watchMode` is `true`, the appropriate watch flag is appended
 *
 * @param entryPermissions - Permissions from the resource entry (overrides defaults)
 * @param defaultPermissions - Global default permissions from `Defaults.Deno.Permissions`
 * @param watchMode - Whether watch mode is enabled for this resource
 * @param watchFlag - The watch flag to append (defaults to `--watch-hmr`)
 * @returns Array of resolved permission/flag strings
 *
 * @example
 * ```ts
 * // Entry overrides defaults
 * resolvePermissions(['--allow-all'], defaultPerms, false);
 * // ['--allow-all']
 *
 * // Defaults + watch mode
 * resolvePermissions(undefined, defaultPerms, true, '--watch-hmr');
 * // ['--allow-net', '--allow-env', '--allow-read', '--allow-sys', '--watch-hmr']
 * ```
 */
export function resolvePermissions(
  entryPermissions: readonly string[] | undefined,
  defaultPermissions: readonly string[],
  watchMode: boolean = false,
  watchFlag: string = RESOURCE_DEFAULTS.WatchHmrFlag,
): string[] {
  const base = entryPermissions ? [...entryPermissions] : [...defaultPermissions];

  if (watchMode) {
    base.push(watchFlag);
  }

  return base;
}
