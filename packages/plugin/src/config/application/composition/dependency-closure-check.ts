import { parse, parseRange, satisfies } from '@std/semver';
import type { PluginCompositionDiagnostic } from '../../../domain/mod.ts';
import type { PluginManifest } from '../../domain/plugin-manifest.ts';

/**
 * Check that every declared plugin dependency is composed at a satisfying version.
 *
 * Every declared dependency must be composed. Its `version` is read as a semver range (an exact
 * version is the range that matches only itself) that the composed plugin's version must satisfy.
 * Library packages that are not plugins belong in `deno.json` imports, not in `dependencies`.
 */
export function checkDependencyClosure(
  plugins: readonly PluginManifest[],
): PluginCompositionDiagnostic[] {
  const composed = new Map(plugins.map((plugin) => [plugin.name, plugin] as const));
  const diagnostics: PluginCompositionDiagnostic[] = [];

  for (const plugin of plugins) {
    for (const [alias, dependency] of Object.entries(plugin.dependencies ?? {})) {
      const target = composed.get(dependency.name);
      if (target === undefined) {
        diagnostics.push({
          code: 'missing-dependency',
          plugin: plugin.name,
          identity: dependency.name,
          message: `Plugin "${plugin.name}" depends on "${dependency.name}" (alias "${alias}"), ` +
            'which is not in the composition.',
        });
        continue;
      }

      const diagnostic = checkVersion(plugin.name, alias, dependency.version, target);
      if (diagnostic) diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

function checkVersion(
  plugin: string,
  alias: string,
  declared: string,
  target: PluginManifest,
): PluginCompositionDiagnostic | undefined {
  const range = tryParse(() => parseRange(declared));
  if (range === undefined) {
    return {
      code: 'invalid-version',
      plugin,
      identity: target.name,
      message: `Plugin "${plugin}" declares dependency "${target.name}" (alias "${alias}") ` +
        `with invalid semver range "${declared}".`,
    };
  }

  const version = tryParse(() => parse(target.version));
  if (version === undefined) {
    return {
      code: 'invalid-version',
      plugin: target.name,
      identity: target.name,
      message: `Plugin "${target.name}" has invalid semver version "${target.version}".`,
    };
  }

  if (satisfies(version, range)) return undefined;
  return {
    code: 'dependency-version-mismatch',
    plugin,
    identity: target.name,
    message: `Plugin "${plugin}" requires "${target.name}" ${declared} (alias "${alias}"), ` +
      `but the composition provides ${target.version}.`,
  };
}

function tryParse<T>(parser: () => T): T | undefined {
  try {
    return parser();
  } catch {
    return undefined;
  }
}
