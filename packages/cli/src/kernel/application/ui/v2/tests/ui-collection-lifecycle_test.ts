import { assert, assertEquals, assertRejects } from '@std/assert';
import { resolve } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { UiConfigSchema } from '../../../../domain/ui/ui-config.ts';
import { readUiLock, writeUiMetadata } from '../config-lock.ts';
import { installUiRegistry } from '../install-registry.ts';
import { updateUiRegistry } from '../registry-lifecycle.ts';
import type { UiRegistryDependencies } from '../registry-client.ts';

Deno.test('locked surface-core updates its member copies without a collection lock key', async () => {
  const fs = new MemoryFileSystemAdapter();
  await installUiRegistry({ root: '/app', names: ['surface-core'] }, { fs });
  const lock = await readUiLock('/app', fs);
  assert(lock);
  assertEquals(Object.hasOwn(lock.items, 'surface-core'), false);
  for (const member of ['theme-seed', 'card', 'panel', 'badge', 'separator']) {
    assert(Object.hasOwn(lock.items, member));
  }
  const missing = lock.items.card.files.find((file) => file.target.endsWith('.tsx'));
  const edited = lock.items.panel.files.find((file) => file.target.endsWith('.tsx'));
  assert(missing && edited);
  await fs.remove(resolve('/app', missing.target));
  const local = edited.content + '// locally edited\n';
  await fs.writeFile(resolve('/app', edited.target), local);
  const result = await updateUiRegistry('/app', ['surface-core'], { fs });
  assert(result.updated.includes(resolve('/app', missing.target)));
  assert(result.drifted.includes(edited.target));
  assertEquals(await fs.readFile(resolve('/app', missing.target)), missing.content);
  assertEquals(await fs.readFile(resolve('/app', edited.target)), local);
  assertEquals(Object.hasOwn((await readUiLock('/app', fs))!.items, 'surface-core'), false);
});

for (const state of ['empty', 'partial', 'complete'] as const) {
  Deno.test(`locked collection membership refuses missing items without writes (${state})`, async () => {
    const fs = new MemoryFileSystemAdapter();
    let sourceReads = 0;
    let version = 1;
    let requests = 0;
    const deps: UiRegistryDependencies = {
      fs,
      transport: {
        read: () => {
          requests++;
          throw new Error('Unexpected remote request');
        },
      },
      builtin: () =>
        Promise.resolve({
          registry: {
            meta: {
              collections: [{ name: 'fixture-group', items: ['a', 'b'] }, {
                name: 'empty-group',
                items: [],
              }],
            },
            items: ['a', 'b', 'missing'].map((name) => ({
              name,
              type: 'registry:ui' as const,
              files: [{
                path: `${name}.ts`,
                type: 'registry:ui' as const,
                target: `@ui/${name}.ts`,
                get content() {
                  sourceReads++;
                  return `export const value = ${version};\n`;
                },
              }],
            })),
          },
          content: {},
        }),
    };
    await writeUiMetadata('/app', UiConfigSchema.parse({}), { version: 1, items: {} }, fs);
    if (state !== 'empty') {
      await installUiRegistry({
        root: '/app',
        names: state === 'partial' ? ['a'] : ['fixture-group'],
      }, deps);
    }
    sourceReads = 0;
    const before = new Map(fs.getFiles());
    for (
      const name of [
        'missing',
        'unknown',
        'empty-group',
        '@remote/missing',
        ...(state === 'complete' ? [] : ['fixture-group']),
      ]
    ) {
      await assertRejects(() => updateUiRegistry('/app', [name], deps), Error, 'is not installed');
      assertEquals(fs.getFiles(), before);
    }
    await assertRejects(
      () => updateUiRegistry('/app', ['fixture-group', 'missing'], deps),
      Error,
      'is not installed',
    );
    assertEquals(fs.getFiles(), before);
    assertEquals(sourceReads, 0, 'Membership checks must not resolve registry file content');
    assertEquals(requests, 0);
    if (state === 'complete') {
      version = 2;
      const result = await updateUiRegistry('/app', ['fixture-group'], deps);
      assertEquals(result.drifted, []);
      assertEquals(result.updated.length, 2);
      assertEquals(await fs.readFile('/app/components/ui/a.ts'), 'export const value = 2;\n');
      assertEquals(await fs.readFile('/app/components/ui/b.ts'), 'export const value = 2;\n');
    }
  });
}
