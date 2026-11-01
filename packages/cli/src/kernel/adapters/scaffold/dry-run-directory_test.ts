import { assertEquals } from '@std/assert';
import { DryRunFileSystemAdapter } from './dry-run-fs.ts';
import { MemoryFileSystemAdapter } from './memory-fs.ts';

Deno.test('dry-run readDir exposes preview children without creating underlying directories', async () => {
  const inner = new MemoryFileSystemAdapter();
  const fs = new DryRunFileSystemAdapter(inner);
  await fs.createDir('/project');
  await fs.createDir('/project/services');
  await fs.writeFile('/project/deno.json', '{}');
  assertEquals(await fs.readDir('/project'), [
    { name: 'deno.json', isFile: true, isDirectory: false },
    { name: 'services', isFile: false, isDirectory: true },
  ]);
  assertEquals(await inner.exists('/project'), false);
});

Deno.test('dry-run readDir preserves existing entries and overlays copies/removals', async () => {
  const inner = new MemoryFileSystemAdapter();
  await inner.writeFile('/project/keep.ts', 'keep');
  await inner.writeFile('/project/remove.ts', 'remove');
  const fs = new DryRunFileSystemAdapter(inner);
  await fs.remove('/project/remove.ts');
  await fs.copy('/project/keep.ts', '/project/copy.ts');
  assertEquals((await fs.readDir('/project')).map((entry) => entry.name), ['copy.ts', 'keep.ts']);
  assertEquals((await inner.readDir('/project')).map((entry) => entry.name), [
    'keep.ts',
    'remove.ts',
  ]);
});
