import type { PluginCompositionDiagnostic } from '../../domain/mod.ts';
import { SINGLETON_CONTRIBUTION_KEYS } from '../domain/contribution-identity.ts';
import type { PluginCompositionResult } from '../domain/plugin-composition.ts';
import type { PluginContributions } from '../domain/plugin-contributions.ts';
import type { PluginManifest } from '../domain/plugin-manifest.ts';
import { checkContributionIdentities } from './composition/contribution-identity-check.ts';
import { checkDependencyClosure } from './composition/dependency-closure-check.ts';
import { mergeContributions } from './contribution-merger.ts';

/**
 * Validate that plugin manifests compose into one root host.
 *
 * This is the single composition check shared by runtime bootstrap and CLI generation. It reports
 * every failure instead of stopping at the first:
 *
 * - duplicate manifest names;
 * - unknown contribution keys and malformed contribution values;
 * - duplicate contribution identities within a plugin, and across plugins on root-owned axes
 *   (contract versions, schema paths, and migrations stay plugin-scoped);
 * - missing declared dependencies, and composed dependencies whose version does not satisfy the
 *   declared semver range.
 *
 * @example
 * ```ts
 * import { definePlugin, validatePluginComposition } from '@netscript/plugin/config';
 *
 * const result = validatePluginComposition([
 *   definePlugin('@example/a', '1.0.0').withService({ name: 'api', entrypoint: './a.ts' }).build(),
 *   definePlugin('@example/b', '1.0.0').withService({ name: 'api', entrypoint: './b.ts' }).build(),
 * ]);
 * if (!result.ok) console.log(result.diagnostics[0]?.code); // 'duplicate-contribution'
 * ```
 */
export function validatePluginComposition(
  plugins: readonly PluginManifest[],
): PluginCompositionResult {
  const { unique, diagnostics } = partitionByName(plugins);
  diagnostics.push(...checkContributionIdentities(unique), ...checkDependencyClosure(unique));
  if (diagnostics.length > 0) return { ok: false, diagnostics };

  return {
    ok: true,
    composition: { plugins: [...plugins], contributions: mergeCollectionAxes(plugins) },
  };
}

function partitionByName(plugins: readonly PluginManifest[]): {
  unique: PluginManifest[];
  diagnostics: PluginCompositionDiagnostic[];
} {
  const names = new Set<string>();
  const unique: PluginManifest[] = [];
  const diagnostics: PluginCompositionDiagnostic[] = [];
  for (const plugin of plugins) {
    if (names.has(plugin.name)) {
      diagnostics.push({
        code: 'duplicate-plugin',
        plugin: plugin.name,
        conflictsWith: plugin.name,
        message: `Plugin "${plugin.name}" is declared more than once.`,
      });
      continue;
    }
    names.add(plugin.name);
    unique.push(plugin);
  }
  return { unique, diagnostics };
}

function mergeCollectionAxes(plugins: readonly PluginManifest[]): PluginContributions {
  return plugins.reduce<PluginContributions>(
    (merged, plugin) => mergeContributions(merged, withoutSingletonAxes(plugin.contributions)),
    {},
  );
}

function withoutSingletonAxes(contributions: PluginContributions): PluginContributions {
  const collection: Record<string, unknown> = { ...contributions };
  for (const axis of SINGLETON_CONTRIBUTION_KEYS) delete collection[axis];
  return collection as PluginContributions;
}
