import { assertEquals } from '@std/assert';

interface DenoConfig {
  compilerOptions?: {
    lib?: string[];
  };
}

async function readConfig(url: URL): Promise<DenoConfig> {
  return JSON.parse(await Deno.readTextFile(url)) as DenoConfig;
}

Deno.test('CLI/E2E compiler libs match production config order', async () => {
  const production = await readConfig(new URL('../../deno.json', import.meta.url));
  const e2e = await readConfig(new URL('../deno.json', import.meta.url));

  assertEquals(e2e.compilerOptions?.lib, production.compilerOptions?.lib);
});
