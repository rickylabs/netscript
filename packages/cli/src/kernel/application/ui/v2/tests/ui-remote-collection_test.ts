import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { UiConfigSchema } from '../../../../domain/ui/ui-config.ts';
import { readUiLock, writeUiMetadata } from '../config-lock.ts';
import { installUiRegistry } from '../install-registry.ts';
import { createUiRegistryClient, type UiRegistryDependencies } from '../registry-client.ts';
import { updateUiRegistry } from '../registry-lifecycle.ts';

/** Remote fixture keeps index reads separate from item/file fetches and versions its content. */
async function fixture() {
  const fs = new MemoryFileSystemAdapter();
  const config = UiConfigSchema.parse({
    registries: {
      '@acme': {
        url: 'https://registry.test/items/{name}.json',
        index: 'https://registry.test/catalog.json',
        headers: { 'X-Fixture': 'collection-test' },
      },
    },
  });
  const reads: string[] = [];
  let version = 1;
  const deps: UiRegistryDependencies = {
    fs,
    builtin: () => Promise.resolve({ registry: { items: [] }, content: {} }),
    transport: {
      read: (url, headers) => {
        assertEquals(headers['X-Fixture'], 'collection-test');
        reads.push(url);
        if (url.endsWith('/catalog.json')) {
          return Promise.resolve(JSON.stringify({
            items: [],
            meta: {
              collections: [
                { name: 'group', items: ['a', 'b'] },
                { name: 'uninstalled', items: ['c'] },
                { name: 'empty', items: [] },
              ],
            },
          }));
        }
        const name = /\/items\/([abc])\.json$/.exec(url)?.[1];
        if (!name) throw new Error(`Unexpected fixture request: ${url}`);
        return Promise.resolve(JSON.stringify({
          name,
          type: 'registry:ui',
          files: [{
            path: `${name}.ts`,
            type: 'registry:ui',
            target: `@ui/remote-${name}.ts`,
            content: `export const value = ${version};\n`,
          }],
        }));
      },
    },
  };
  await writeUiMetadata('/app', config, { version: 1, items: {} }, fs);
  return { fs, config, deps, reads, nextVersion: () => version++ };
}

for (const members of [['a'], ['a', 'b']]) {
  Deno.test(`remote collection updates only installed members (${members.join(',')})`, async () => {
    const f = await fixture();
    await installUiRegistry(
      { root: '/app', names: members.map((name) => `@acme/${name}`) },
      f.deps,
    );
    f.nextVersion();
    f.reads.length = 0;
    const result = await updateUiRegistry('/app', ['@acme/group', '@acme/group'], f.deps);
    assertEquals(result.drifted, []);
    assertEquals(result.updated.length, members.length);
    for (const member of members) {
      assertEquals(
        await f.fs.readFile(`/app/components/ui/remote-${member}.ts`),
        'export const value = 2;\n',
      );
    }
    const lock = await readUiLock('/app', f.fs);
    assert(lock);
    assertEquals(Object.keys(lock.items).sort(), members.map((name) => `@acme/${name}`).sort());
    assertEquals(f.reads.filter((url) => url.endsWith('/catalog.json')).length, 1);
    assertEquals(
      f.reads.filter((url) => url.includes('/items/')).sort(),
      members.map((name) => `https://registry.test/items/${name}.json`).sort(),
    );
    assertEquals(await f.fs.exists('/app/components/ui/remote-c.ts'), false);
    if (!members.includes('b')) {
      assertEquals(await f.fs.exists('/app/components/ui/remote-b.ts'), false);
    }
  });
}

Deno.test('remote collection restores missing copies and preserves local edits and baselines', async () => {
  const f = await fixture();
  await installUiRegistry({ root: '/app', names: ['@acme/a', '@acme/b'] }, f.deps);
  const original = await readUiLock('/app', f.fs);
  assert(original);
  const edited = '// local customization\n';
  await f.fs.writeFile('/app/components/ui/remote-a.ts', edited);
  await f.fs.remove('/app/components/ui/remote-b.ts');
  f.nextVersion();
  const result = await updateUiRegistry('/app', ['@acme/group'], f.deps);
  assertEquals(result.drifted, ['components/ui/remote-a.ts']);
  assertEquals(await f.fs.readFile('/app/components/ui/remote-a.ts'), edited);
  assertEquals(await f.fs.readFile('/app/components/ui/remote-b.ts'), 'export const value = 2;\n');
  const lock = await readUiLock('/app', f.fs);
  assertEquals(lock?.items['@acme/a'].files, original.items['@acme/a'].files);
  assertEquals(Object.hasOwn(lock!.items, '@acme/group'), false);
});

for (const installed of [false, true]) {
  Deno.test(`unknown and uninstalled remote collections diagnose without writes (installed=${installed})`, async () => {
    const f = await fixture();
    if (installed) await installUiRegistry({ root: '/app', names: ['@acme/a'] }, f.deps);
    for (
      const [name, message] of [
        ['@acme/unknown', 'no remote collection matches'],
        ['@acme/empty', 'has no installed items'],
        ['@acme/uninstalled', 'has no installed items'],
        ...(!installed ? [['@acme/group', 'has no installed items']] : []),
      ]
    ) {
      const before = new Map(f.fs.getFiles());
      f.reads.length = 0;
      await assertRejects(() => updateUiRegistry('/app', [name], f.deps), Error, message);
      assertEquals(f.fs.getFiles(), before);
      assertEquals(f.reads, ['https://registry.test/catalog.json']);
    }
  });
}

Deno.test('a mixed valid collection and invalid request fails before resolving member files', async () => {
  const f = await fixture();
  await installUiRegistry({ root: '/app', names: ['@acme/a'] }, f.deps);
  f.nextVersion();
  for (const names of [['@acme/group', '@acme/unknown'], ['@acme/unknown', '@acme/group']]) {
    const before = new Map(f.fs.getFiles());
    f.reads.length = 0;
    await assertRejects(
      () => updateUiRegistry('/app', names, f.deps),
      Error,
      'no remote collection matches',
    );
    assertEquals(f.fs.getFiles(), before);
    assertEquals(f.reads, ['https://registry.test/catalog.json']);
  }
});

Deno.test('an installed namespaced item still updates without reading collection metadata', async () => {
  const f = await fixture();
  await installUiRegistry({ root: '/app', names: ['@acme/a'] }, f.deps);
  f.nextVersion();
  f.reads.length = 0;
  await updateUiRegistry('/app', ['@acme/a'], f.deps);
  assertEquals(f.reads, ['https://registry.test/items/a.json']);
  assertEquals(await f.fs.readFile('/app/components/ui/remote-a.ts'), 'export const value = 2;\n');
});

Deno.test('an uninstalled remote item keeps the not-installed diagnostic and writes nothing', async () => {
  const f = await fixture();
  await installUiRegistry({ root: '/app', names: ['@acme/a'] }, f.deps);
  const before = new Map(f.fs.getFiles());
  f.reads.length = 0;
  await assertRejects(
    () => updateUiRegistry('/app', ['@acme/c'], f.deps),
    Error,
    "Registry item '@acme/c' is not installed",
  );
  assertEquals(f.fs.getFiles(), before);
  assertEquals(f.reads, ['https://registry.test/catalog.json']);
});

Deno.test('remote collection metadata qualifies bare members without changing explicit references', async () => {
  const client = await createUiRegistryClient(
    UiConfigSchema.parse({
      registries: { '@acme': 'https://registry.test/{name}.json' },
    }),
    {
      transport: {
        read: () =>
          Promise.resolve(JSON.stringify({
            items: [],
            meta: {
              collections: [{
                name: 'group',
                items: ['a', '@other/b', 'https://other.test/c.json'],
              }],
            },
          })),
      },
    },
  );
  assertEquals(await client.collections('@acme'), [{
    name: '@acme/group',
    items: ['@acme/a', '@other/b', 'https://other.test/c.json'],
  }]);
});
