import { assertEquals } from '@std/assert';

import { createPluginAdapter } from './factory.ts';
import { createTestPlugin, testLogger } from './test_fixtures.ts';

Deno.test('createPluginAdapter creates CLI and scaffold entrypoints', async () => {
  const adapter = createPluginAdapter(createTestPlugin());

  const cli = adapter.toCli();
  const info = await cli({ command: 'info' });
  assertEquals(info.code, 0);

  const scaffold = adapter.toScaffold();
  const result = await scaffold({
    workspaceRoot: await Deno.makeTempDir(),
    options: {},
    dryRun: true,
    logger: testLogger,
  });
  assertEquals(result.status, 'planned');
});
