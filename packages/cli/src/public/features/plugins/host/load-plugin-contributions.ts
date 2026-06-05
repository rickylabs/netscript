import { mergeContributions } from '@netscript/plugin/config';
import type { PluginContributions, PluginManifest } from '@netscript/plugin/config';

/** Resolve the combined contribution set from plugin manifests. */
export function resolvePluginContributions(
  plugins: readonly PluginManifest[],
): PluginContributions {
  return plugins.reduce(
    (contributions, plugin) => mergeContributions(contributions, plugin.contributions ?? {}),
    {},
  );
}
