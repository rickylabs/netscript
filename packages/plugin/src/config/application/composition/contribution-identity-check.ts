import type { PluginCompositionDiagnostic } from '../../../domain/mod.ts';
import {
  CONTRIBUTION_IDENTITY_RULES,
  isContributionKey,
} from '../../domain/contribution-identity.ts';
import type { PluginManifest } from '../../domain/plugin-manifest.ts';

/**
 * Check contribution keys and identities across a composition.
 *
 * Unknown keys and malformed values are reported per plugin. Identities must be unique within their
 * plugin on every axis, and across plugins on `root`-scoped axes.
 */
export function checkContributionIdentities(
  plugins: readonly PluginManifest[],
): PluginCompositionDiagnostic[] {
  const diagnostics: PluginCompositionDiagnostic[] = [];
  const rootOwners = new Map<string, string>();

  for (const plugin of plugins) {
    const contributions: unknown = plugin.contributions;
    if (contributions === null || typeof contributions !== 'object') {
      diagnostics.push({
        code: 'invalid-contribution',
        plugin: plugin.name,
        message: `Plugin "${plugin.name}" must declare contributions as an object.`,
      });
      continue;
    }

    for (const [axis, value] of Object.entries(contributions)) {
      if (!isContributionKey(axis)) {
        diagnostics.push({
          code: 'unknown-contribution-key',
          plugin: plugin.name,
          axis,
          message: `Plugin "${plugin.name}" declares unknown contribution key "${axis}".`,
        });
        continue;
      }
      if (value === undefined) continue;

      const rule = CONTRIBUTION_IDENTITY_RULES[axis];
      const identities = rule.identities(value);
      if (identities === undefined) {
        diagnostics.push({
          code: 'invalid-contribution',
          plugin: plugin.name,
          axis,
          message: `Plugin "${plugin.name}" declares a malformed "${axis}" contribution.`,
        });
        continue;
      }

      const seen = new Set<string>();
      for (const identity of identities) {
        if (seen.has(identity)) {
          diagnostics.push(duplicate(plugin.name, axis, identity, plugin.name));
          continue;
        }
        seen.add(identity);
        if (rule.scope !== 'root') continue;

        const key = `${axis}\u0000${identity}`;
        const owner = rootOwners.get(key);
        if (owner === undefined) rootOwners.set(key, plugin.name);
        else diagnostics.push(duplicate(plugin.name, axis, identity, owner));
      }
    }
  }

  return diagnostics;
}

function duplicate(
  plugin: string,
  axis: string,
  identity: string,
  owner: string,
): PluginCompositionDiagnostic {
  const where = owner === plugin
    ? `more than once`
    : `but plugin "${owner}" already owns it on the root-owned axis`;
  return {
    code: 'duplicate-contribution',
    plugin,
    axis,
    identity,
    conflictsWith: owner,
    message: `Plugin "${plugin}" declares "${axis}" identity "${identity}" ${where}.`,
  };
}
