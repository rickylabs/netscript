import { assertEquals } from '@std/assert';
import { runtimeCatalogDependencies } from '../../../../../fresh/tests/runtime-catalog-dependencies.ts';
import {
  SCAFFOLD_APP_CATALOG,
  SCAFFOLD_APP_IMPORTS,
  SCAFFOLD_WORKSPACE_CATALOG,
} from './scaffold-app-catalog.ts';

interface DenoConfig {
  readonly catalog?: Readonly<Record<string, string>>;
  readonly imports?: Readonly<Record<string, string>>;
}

async function readConfig(url: URL): Promise<DenoConfig> {
  return JSON.parse(await Deno.readTextFile(url)) as DenoConfig;
}

Deno.test('scaffold runtime npm imports match workspace, Fresh, and SDK catalogs', async () => {
  const root = await readConfig(new URL('../../../../../../deno.json', import.meta.url));
  const fresh = await readConfig(new URL('../../../../../fresh/deno.json', import.meta.url));
  const sdk = await readConfig(new URL('../../../../../sdk/deno.json', import.meta.url));
  const sdkPackage = await readConfig(new URL('../../../../../sdk/package.json', import.meta.url));
  const sdkRuntimeDependencies = Object.keys(
    (sdkPackage as { dependencies?: Record<string, string> }).dependencies ?? {},
  );
  const runtimeDependencies = new Set([
    ...runtimeCatalogDependencies,
    ...sdkRuntimeDependencies,
  ]);
  const scaffoldImports: Readonly<Record<string, string>> = SCAFFOLD_APP_IMPORTS;

  for (const dependency of runtimeDependencies) {
    const version = root.catalog?.[dependency];
    assertEquals(typeof version, 'string', `${dependency} must exist in the root catalog`);

    const expected = `npm:${dependency}@${version}`;
    if (runtimeCatalogDependencies.includes(dependency as never)) {
      assertEquals(
        fresh.imports?.[dependency],
        expected,
        `${dependency} in the Fresh manifest must match the root catalog`,
      );
    }
    if (sdkRuntimeDependencies.includes(dependency)) {
      assertEquals(
        sdk.imports?.[dependency],
        expected,
        `${dependency} in the SDK manifest must match the root catalog`,
      );
    }
    assertEquals(
      scaffoldImports[dependency],
      expected,
      `${dependency} in scaffold output must match the root catalog`,
    );
  }
});

Deno.test('standalone workspace Zod catalog matches the repository authority', async () => {
  const root = await readConfig(new URL('../../../../../../deno.json', import.meta.url));

  assertEquals(root.catalog?.zod, SCAFFOLD_APP_CATALOG.ZOD);
  assertEquals(SCAFFOLD_WORKSPACE_CATALOG.zod, root.catalog?.zod);
});
