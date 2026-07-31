import { assertEquals } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import {
  installUiRegistryItems,
  listUiRegistryItems,
  removeUiRegistryItem,
  updateUiRegistryItems,
} from './registry.ts';

const SDK_DENO_JSON = new URL('../../../../../sdk/deno.json', import.meta.url);

/** The `@netscript/sdk` release this workspace ships — the pin the manifest must carry. */
async function sdkWorkspaceVersion(): Promise<string> {
  const manifest = JSON.parse(await Deno.readTextFile(SDK_DENO_JSON)) as { version: string };
  return manifest.version;
}

async function readImports(
  fs: MemoryFileSystemAdapter,
): Promise<Record<string, string>> {
  const config = JSON.parse(await fs.readFile('/app/deno.json')) as {
    imports?: Record<string, string>;
  };
  return config.imports ?? {};
}

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

Deno.test('installing the desktop items pins the SDK release the workspace ships', async () => {
  const fs = new MemoryFileSystemAdapter();
  await installUiRegistryItems(
    { projectRoot: '/app', names: ['desktop-only', 'desktop-update-prompt'], overwrite: false },
    { fs },
  );

  const imports = await readImports(fs);
  assertEquals(imports['@netscript/sdk'], `jsr:@netscript/sdk@${await sdkWorkspaceVersion()}`);
});

Deno.test('removing one desktop item keeps the SDK import the other still needs', async () => {
  const fs = new MemoryFileSystemAdapter();
  await installUiRegistryItems(
    { projectRoot: '/app', names: ['desktop-only', 'desktop-update-prompt'], overwrite: false },
    { fs },
  );
  await removeUiRegistryItem('/app', 'desktop-only', fs);

  const imports = await readImports(fs);
  assertEquals(imports['@netscript/sdk'], `jsr:@netscript/sdk@${await sdkWorkspaceVersion()}`);
});
