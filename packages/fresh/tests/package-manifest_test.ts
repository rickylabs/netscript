import { assertEquals } from '@std/assert';

const runtimeCatalogDependencies = [
  '@preact/signals',
  '@tanstack/preact-query',
  '@tanstack/query-core',
  '@tanstack/react-db',
  'vite',
] as const;

Deno.test('published manifest declares every catalog-backed Fresh runtime dependency', async () => {
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL('../deno.json', import.meta.url)),
  ) as { imports?: Record<string, string> };

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
