import type { PluginManifest } from '../config/mod.ts';

/** Example plugin manifest fixture. */
export function createPluginManifestFixture(
  overrides: Partial<PluginManifest> = {},
): PluginManifest {
  return {
    name: '@example/plugin',
    version: '0.0.1-alpha.0',
    description: 'Example plugin.',
    contributions: {},
    ...overrides,
  };
}
