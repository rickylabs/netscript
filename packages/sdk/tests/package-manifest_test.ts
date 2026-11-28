import { assertEquals } from '@std/assert';
import { materializeCatalogImports } from '../../../.llm/tools/release/publish-workspace.ts';

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
  // dependency only in package.json makes clean Vite SSR fail while warm caches appear healthy
  // unless the publish materializer writes explicit npm: specifiers into the shipped deno.json.
  const materialized = materializeCatalogImports(
    denoManifest.imports,
    rootManifest.catalog ?? {},
    'packages/sdk',
    packageManifest.dependencies,
  ) as Record<string, string> | undefined;

  for (const dependency of Object.keys(packageManifest.dependencies ?? {})) {
    const version = rootManifest.catalog?.[dependency];
    assertEquals(typeof version, 'string', `${dependency} must exist in the root catalog`);
    assertEquals(
      materialized?.[dependency],
      `npm:${dependency}@${version}`,
      `${dependency} must materialize to an explicit npm: specifier in the published deno.json imports`,
    );
  }
});
