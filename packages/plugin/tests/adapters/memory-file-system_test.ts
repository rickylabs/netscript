import { assertEquals } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../src/adapters/mod.ts';
import type { FileSystemPort } from '../../src/ports/mod.ts';

Deno.test('memory file system adapter implements text file operations', async () => {
  const fileSystem: FileSystemPort = new MemoryFileSystemAdapter();

  assertEquals(await fileSystem.exists('plugin.ts'), false);
  assertEquals(await fileSystem.readText('plugin.ts'), '');

  await fileSystem.writeText('plugin.ts', 'export default plugin;');

  assertEquals(await fileSystem.exists('plugin.ts'), true);
  assertEquals(await fileSystem.readText('plugin.ts'), 'export default plugin;');
});
