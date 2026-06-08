import { assertEquals } from '@std/assert';

import { loadPluginManifest } from '../../src/application/mod.ts';
import type { ManifestResolverPort } from '../../src/sdk/mod.ts';
import { createPluginManifestFixture } from '../../src/testing/mod.ts';

Deno.test('loadPluginManifest returns the resolver manifest', async () => {
  const manifest = createPluginManifestFixture({ name: '@example/loaded-plugin' });
  const resolver: ManifestResolverPort = {
    resolve: (spec) => Promise.resolve(spec === './plugin.ts' ? manifest : undefined),
  };

  const loaded = await loadPluginManifest('./plugin.ts', resolver);

  assertEquals(loaded?.name, '@example/loaded-plugin');
});

Deno.test('loadPluginManifest preserves unresolved plugin manifests', async () => {
  const resolver: ManifestResolverPort = {
    resolve: () => Promise.resolve(undefined),
  };

  const loaded = await loadPluginManifest('./missing.ts', resolver);

  assertEquals(loaded, undefined);
});
