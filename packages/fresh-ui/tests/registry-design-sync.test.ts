import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { loadConfig } from '../../../tools/design-sync/src/config.ts';
import { freshUiRegistryManifest } from '../registry.manifest.ts';
import { FreshUiRegistrySource } from '../../../tools/design-sync/src/registry-source.ts';

Deno.test('dashboard design-sync loads the legacy manifest rather than the portable catalog', async () => {
  const config = await loadConfig(fromFileUrl(
    new URL(
      '../../../resources/design/dashboard/.design-sync/config.json',
      import.meta.url,
    ),
  ));
  const units = await new FreshUiRegistrySource(config).load();
  assertEquals(
    units.map((unit) => unit.item.name).sort(),
    freshUiRegistryManifest.items.map((item) => item.name).sort(),
  );
  assertEquals(units.some((unit) => unit.item.name === 'style-utility'), false);
  assertEquals(
    units.find((unit) => unit.item.name === 'cn')?.sources[0]?.registryPath,
    'registry/lib/cn.ts',
  );
});
