import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { listUiRegistryItems, removeUiRegistryItem, updateUiRegistryItems } from './registry.ts';

Deno.test('registry list mirrors the manifest and flags installed items', async () => {
  const fs = new MemoryFileSystemAdapter();
  const before = await listUiRegistryItems('/app', fs);
  const cn = before.items.find((item) => item.name === 'cn');
  if (!cn || cn.installed) throw new Error('Expected cn to start available');
  await fs.writeFile('/app/lib/cn.ts', '// installed');
  const after = await listUiRegistryItems('/app', fs);
  if (!after.items.find((item) => item.name === 'cn')?.installed) throw new Error('Expected cn installed state');
});

Deno.test('registry update reports local edits without clobbering them', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/lib/cn.ts', '// local edit');
  const result = await updateUiRegistryItems('/app', ['cn'], fs);
  if (!result.drifted.includes('/app/lib/cn.ts')) throw new Error('Expected edited file drift');
  if (await fs.readFile('/app/lib/cn.ts') !== '// local edit') throw new Error('Update clobbered local edit');
});

Deno.test('registry remove deletes files and dependency imports', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/lib/cn.ts', 'installed');
  await fs.writeFile('/app/deno.json', JSON.stringify({ imports: { clsx: 'npm:clsx@^2.1.1', keep: 'npm:keep@1' } }));
  await removeUiRegistryItem('/app', 'cn', fs);
  if (await fs.exists('/app/lib/cn.ts')) throw new Error('Removed file remains');
  const config = JSON.parse(await fs.readFile('/app/deno.json')) as { imports: Record<string, string> };
  if (config.imports.clsx || !config.imports.keep) throw new Error('Dependency pruning was not selective');
});
