import { assertEquals } from '@std/assert';
import { runtimeCatalogDependencies } from './runtime-catalog-dependencies.ts';

Deno.test('published manifest declares every catalog-backed Fresh runtime dependency', async () => {
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL('../deno.json', import.meta.url)),
  ) as { exports?: Record<string, string>; imports?: Record<string, string> };

  assertEquals(
    manifest.exports?.['./defer/island'],
    './src/application/defer/island.ts',
    'The defer island must remain available through its narrow package subpath',
  );

  // JSR publishes deno.json, not package.json. A dependency present only in the workspace
  // catalog works with a warm contributor cache but fails in clean Vite SSR with
  // "Cannot find module npm:..." — the defect that made canary.4 return HTTP 500.
  for (const dependency of runtimeCatalogDependencies) {
    assertEquals(
      manifest.imports?.[dependency]?.startsWith('npm:'),
      true,
      `${dependency} must be present in the published deno.json imports`,
    );
  }
});
