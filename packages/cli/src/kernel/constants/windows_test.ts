import { assertEquals } from '@std/assert';
import { COMPILE_CONFIG, DEFAULT_BUNDLE_EXTERNAL_IMPORTS } from './windows.ts';

Deno.test('Windows deploy compile durable-streams imports match the workspace family', async () => {
  const workspace: { catalog: Record<string, string> } = JSON.parse(
    await Deno.readTextFile(new URL('../../../../../deno.json', import.meta.url)),
  );
  const compile: { imports: Record<string, string> } = JSON.parse(COMPILE_CONFIG.content);

  for (const imports of [DEFAULT_BUNDLE_EXTERNAL_IMPORTS, compile.imports]) {
    assertEquals(imports['@durable-streams/server'], 'npm:@durable-streams/server@0.3.9');
    for (const [name, specifier] of Object.entries(imports)) {
      if (!name.startsWith('@durable-streams/')) continue;
      assertEquals(specifier, `npm:${name}@${workspace.catalog[name]}`);
    }
  }
});
