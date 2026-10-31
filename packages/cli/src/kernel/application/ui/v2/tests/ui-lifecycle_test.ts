import type { UiRegistryDependencies } from '../registry-client.ts';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { UiConfigSchema } from '../../../../domain/ui/ui-config.ts';
import { writeUiMetadata } from '../config-lock.ts';
import { installUiRegistry } from '../install-registry.ts';
import { installUiRegistryItems, listUiRegistryItems } from '../../registry.ts';
import { updateUiRegistry } from '../registry-lifecycle.ts';

for (const populated of [false, true]) {
  Deno.test(`named update refuses uninstalled items before resolving or writing (${populated ? 'populated' : 'empty'} lock)`, async () => {
    const fs = new MemoryFileSystemAdapter();
    let resolutions = 0;
    const deps: UiRegistryDependencies = {
      fs,
      builtin: () => {
        resolutions++;
        return Promise.resolve({
          registry: {
            items: [{
              name: 'x',
              type: 'registry:ui',
              files: [{
                path: 'x.ts',
                type: 'registry:ui',
                target: '@ui/x.ts',
                content: 'export const x = 1;\n',
              }],
            }, {
              name: 'installed',
              type: 'registry:ui',
              files: [{
                path: 'installed.ts',
                type: 'registry:ui',
                target: '@ui/installed.ts',
                content: 'export const installed = 1;\n',
              }],
            }],
          },
          content: {},
        });
      },
    };
    await writeUiMetadata('/app', UiConfigSchema.parse({}), { version: 1, items: {} }, fs);
    if (populated) await installUiRegistry({ root: '/app', names: ['installed'] }, deps);
    resolutions = 0;
    const before = new Map(fs.getFiles());
    await assertRejects(
      () => updateUiRegistry('/app', populated ? ['installed', 'x'] : ['x'], deps),
      Error,
      "Registry item 'x' is not installed",
    );
    assertEquals(fs.getFiles(), before);
    assertEquals(
      resolutions,
      0,
      'Missing lock entries must be rejected before registry resolution',
    );
    if (!populated) {
      assertEquals(await updateUiRegistry('/app', [], deps), { updated: [], drifted: [] });
    }
  });
}

Deno.test('named update without a lock refuses installation and leaves the app untouched', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/deno.json', '{}');
  const before = new Map(fs.getFiles());
  await assertRejects(
    () => updateUiRegistry('/app', ['button'], { fs }),
    Error,
    "Registry item 'button' is not installed",
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test('named legacy updates restore missing copies and preserve edited files without a lock', async () => {
  const fs = new MemoryFileSystemAdapter();
  const installed = await installUiRegistryItems({
    projectRoot: '/app',
    names: ['foundation'],
    overwrite: false,
  }, { fs });
  assert(installed.copiedFiles.length > 2);
  const [missing, edited] = installed.copiedFiles;
  const original = await fs.readFile(missing);
  await fs.remove(missing);
  await fs.writeFile(edited, '// local edit\n');
  const result = await updateUiRegistry('/app', ['foundation'], { fs });
  assert(result.updated.includes(missing));
  assertEquals(await fs.readFile(missing), original);
  assert(result.drifted.includes(edited));
  assertEquals(await fs.readFile(edited), '// local edit\n');
  assertEquals(await fs.exists('/app/fresh-ui.lock.json'), false);
});

Deno.test('partial legacy discovery is explicit and dependency copies do not count as the requested item', async () => {
  const fs = new MemoryFileSystemAdapter();
  await installUiRegistryItems({ projectRoot: '/app', names: ['theme-ns-one'], overwrite: false }, {
    fs,
  });
  await fs.remove('/app/assets/theme-bridge.css');
  const complete = await listUiRegistryItems('/app', fs);
  const partial = await listUiRegistryItems('/app', fs, { includePartial: true });
  assertEquals(complete.items.find((item) => item.name === 'theme-ns-one')?.installed, false);
  assertEquals(partial.items.find((item) => item.name === 'theme-ns-one')?.installed, true);
  const before = new Map(fs.getFiles());
  await assertRejects(
    () => updateUiRegistry('/app', ['button'], { fs }),
    Error,
    "Registry item 'button' is not installed",
  );
  assertEquals(fs.getFiles(), before);
  const result = await updateUiRegistry('/app', ['theme-ns-one'], { fs });
  assert(result.updated.includes('/app/assets/theme-bridge.css'));
  assertEquals(await fs.exists('/app/fresh-ui.lock.json'), false);
});
