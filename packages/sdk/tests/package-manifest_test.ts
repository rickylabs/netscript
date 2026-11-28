import { assertEquals } from '@std/assert';

Deno.test('published manifest declares every SDK runtime dependency', async () => {
  const rootManifest = JSON.parse(
    await Deno.readTextFile(new URL('../../../deno.json', import.meta.url)),
  ) as { catalog?: Record<string, string> };
  const packageManifest = JSON.parse(
    await Deno.readTextFile(new URL('../package.json', import.meta.url)),
  ) as { dependencies?: Record<string, string> };
  const denoManifest = JSON.parse(
    await Deno.readTextFile(new URL('../deno.json', import.meta.url)),
  ) as { imports?: Record<string, string> };

  // JSR consumers do not inherit the producer workspace catalog. Keeping an npm runtime
  // dependency only in package.json makes clean Vite SSR fail while warm caches appear healthy.
  // Declaring "catalog:" in deno.json imports is materialized to "npm:<pkg>@<version>" by
  // .llm/tools/release/publish-workspace.ts before publishing to JSR.
  for (const dependency of Object.keys(packageManifest.dependencies ?? {})) {
    const specifier = denoManifest.imports?.[dependency];
    const isMaterializableCatalog = specifier === 'catalog:' &&
      typeof rootManifest.catalog?.[dependency] === 'string';
    assertEquals(
      Boolean(specifier?.startsWith('npm:')) || isMaterializableCatalog,
      true,
      `${dependency} must be present in the published deno.json imports (npm: or root-catalog-backed catalog:)`,
    );
  }
});
