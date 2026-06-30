import { assertEquals } from '@std/assert';

import { runInstallCommand } from './install.ts';
import { createTestContext, createTestPlugin, MemoryFileSystem } from '../test_fixtures.ts';

Deno.test('runInstallCommand writes starter artifacts through the shared emit path', async () => {
  const fileSystem = new MemoryFileSystem();
  const result = await runInstallCommand({
    plugin: createTestPlugin(),
    context: createTestContext(fileSystem),
  });

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, ['src/jobs/starter.ts']);
  assertEquals(
    fileSystem.files.get('/workspace/src/jobs/starter.ts'),
    'export const id = "starter";',
  );
});
