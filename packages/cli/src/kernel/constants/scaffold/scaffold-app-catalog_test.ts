import { assertEquals } from '@std/assert';
import { runtimeCatalogDependencies } from '../../../../../fresh/tests/runtime-catalog-dependencies.ts';
import { SCAFFOLD_APP_IMPORTS } from './scaffold-app-catalog.ts';

interface DenoConfig {
  readonly catalog?: Readonly<Record<string, string>>;
  readonly imports?: Readonly<Record<string, string>>;
}

async function readConfig(url: URL): Promise<DenoConfig> {
  return JSON.parse(await Deno.readTextFile(url)) as DenoConfig;
}

Deno.test('scaffold runtime npm imports match the workspace and Fresh catalogs', async () => {
  const root = await readConfig(new URL('../../../../../../deno.json', import.meta.url));
  const fresh = await readConfig(new URL('../../../../../fresh/deno.json', import.meta.url));

  for (const dependency of runtimeCatalogDependencies) {
    const version = root.catalog?.[dependency];
    assertEquals(typeof version, 'string', `${dependency} must exist in the root catalog`);

    const expected = `npm:${dependency}@${version}`;
    assertEquals(
      fresh.imports?.[dependency],
      expected,
      `${dependency} in the Fresh manifest must match the root catalog`,
    );
    assertEquals(
      SCAFFOLD_APP_IMPORTS[dependency],
      expected,
      `${dependency} in scaffold output must match the root catalog`,
    );
  }
});
