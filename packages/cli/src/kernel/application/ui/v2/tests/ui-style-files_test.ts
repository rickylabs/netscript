import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import type { Registry } from '@netscript/fresh-ui/registry-v2';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { installUiRegistry, UiRegistryConflictError } from '../install-registry.ts';
import { readUiConfig, readUiLock } from '../config-lock.ts';
import { updateUiRegistry } from '../registry-lifecycle.ts';

async function fixture(options: { sharedRetired?: boolean; requiredBase?: boolean } = {}) {
  const fs = new MemoryFileSystemAdapter();
  const registry: Registry = {
    items: [
      {
        name: 'x',
        type: 'registry:component',
        registryDependencies: ['control-style'],
        files: [{
          path: 'x.ts',
          type: 'registry:component',
          target: '@ui/x.ts',
          content: 'export const x = 1;\n',
        }],
      },
      {
        name: 'fixture-x',
        type: 'registry:component',
        registryDependencies: ['control-style'],
        files: [{
          path: 'fixture/x.ts',
          type: 'registry:component',
          target: '@ui/x.ts',
          content: 'export const x = 2;\n',
        }],
      },
      {
        name: 'style-utility',
        type: 'registry:style',
        meta: { components: { x: 'x', 'control-style': 'control-style' } },
        files: [
          {
            path: 'utility/skin.css',
            type: 'registry:file',
            target: '@assets/skin.css',
            content: '.skin { color: red; }\n',
          },
          {
            path: 'utility/obsolete.css',
            type: 'registry:file',
            target: '@assets/obsolete.css',
            content: '.obsolete {}\n',
          },
        ],
      },
      {
        name: 'fixture-style',
        type: 'registry:style',
        meta: { components: { x: 'fixture-x', 'control-style': 'fixture-control-style' } },
        files: [
          {
            path: 'fixture/skin.css',
            type: 'registry:file',
            target: options.requiredBase ? '@assets/fixture.css' : '@assets/skin.css',
            content: '.skin { color: blue; }\n',
          },
        ],
      },
      {
        name: 'control-style',
        type: 'registry:style',
        files: [{
          path: 'utility/control.css',
          type: 'registry:file',
          target: '@assets/control.css',
          content: '.control { color: red; }\n',
        }],
      },
      {
        name: 'fixture-control-style',
        type: 'registry:style',
        files: [{
          path: 'fixture/control.css',
          type: 'registry:file',
          target: '@assets/control.css',
          content: '.control { color: blue; }\n',
        }],
      },
      {
        name: 'passive-style',
        type: 'registry:style',
        files: [
          {
            path: 'passive.css',
            type: 'registry:file',
            target: '@assets/passive.css',
            content: '.passive {}\n',
          },
        ],
      },
    ],
  };
  const passive = registry.items.find((item) => item.name === 'passive-style')!;
  const updated: Registry = {
    ...registry,
    items: registry.items.map((item) =>
      item === passive
        ? {
          ...item,
          ...(options.requiredBase ? { registryDependencies: ['inherited-style'] } : {}),
          files: [
            ...(item.files ?? []),
            ...(options.sharedRetired
              ? [{
                path: 'shared/obsolete.css',
                type: 'registry:file' as const,
                target: '@assets/obsolete.css',
                content: '.obsolete {}\n',
              }]
              : []),
          ],
        }
        : item
    ).concat(
      options.requiredBase
        ? [{
          name: 'inherited-style',
          type: 'registry:style',
          meta: { components: { x: 'x' } },
          registryDependencies: ['style-utility'],
        }]
        : [],
    ),
  };
  const deps = { fs, builtin: () => Promise.resolve({ registry: updated, content: {} }) };
  await installUiRegistry({ root: '/app', names: ['x', 'style-utility', 'passive-style'] }, deps);
  return deps;
}

Deno.test('component style selection transfers shared files, retires unused CSS and preserves independent styles', async () => {
  const deps = await fixture();
  await deps.fs.writeFile('/app/assets/app.css', '.app {}');
  await installUiRegistry({ root: '/app', names: ['fixture-style'] }, deps);
  assertStringIncludes(await deps.fs.readFile('/app/assets/skin.css'), 'blue');
  assertEquals(await deps.fs.exists('/app/assets/obsolete.css'), false);
  assertEquals((await readUiLock('/app', deps.fs))!.items['style-utility'], undefined);
  assertEquals((await readUiConfig('/app', deps.fs)).style, 'fixture-style');
  assertEquals(await deps.fs.readFile('/app/assets/passive.css'), '.passive {}\n');
  assertEquals(await deps.fs.readFile('/app/assets/app.css'), '.app {}');
  assertStringIncludes(await deps.fs.readFile('/app/assets/control.css'), 'blue');
  assertEquals(
    (await readUiLock('/app', deps.fs))!.items['control-style'].source,
    'builtin:fixture-control-style',
  );
  const styles = await deps.fs.readFile('/app/assets/styles.css');
  assertEquals(styles.includes('obsolete.css'), false);
  assertStringIncludes(styles, 'passive.css');
  await updateUiRegistry('/app', [], deps);
  assertStringIncludes(await deps.fs.readFile('/app/assets/skin.css'), 'blue');
  assertStringIncludes(await deps.fs.readFile('/app/assets/control.css'), 'blue');
});

Deno.test('edited shared or retired style files refuse the entire transition even with force', async () => {
  for (const name of ['skin.css', 'obsolete.css']) {
    const deps = await fixture();
    await deps.fs.writeFile(`/app/assets/${name}`, '// app modification\n');
    const before = new Map(deps.fs.getFiles());
    const error = await assertRejects(
      () => installUiRegistry({ root: '/app', names: ['fixture-style'], force: true }, deps),
      UiRegistryConflictError,
    );
    assertStringIncludes(error.message, name);
    assertStringIncludes(error.message, '+// app modification');
    assertEquals(deps.fs.getFiles(), before);
  }
});

Deno.test('style retirement preserves a file that an independent style still owns', async () => {
  const deps = await fixture({ sharedRetired: true });
  await installUiRegistry({ root: '/app', names: ['fixture-style'] }, deps);
  assertEquals(await deps.fs.readFile('/app/assets/obsolete.css'), '.obsolete {}\n');
  assertStringIncludes(await deps.fs.readFile('/app/assets/styles.css'), 'obsolete.css');
  assertEquals((await readUiLock('/app', deps.fs))!.items['style-utility'], undefined);
});

Deno.test('style retirement retains transitive dependencies of independent installed items', async () => {
  const deps = await fixture({ requiredBase: true });
  await installUiRegistry({ root: '/app', names: ['fixture-style'] }, deps);
  const lock = (await readUiLock('/app', deps.fs))!;
  assertEquals(lock.items['style-utility'].type, 'registry:style');
  assertEquals(lock.items['inherited-style'].type, 'registry:style');
  assertStringIncludes(await deps.fs.readFile('/app/assets/fixture.css'), 'blue');
  assertStringIncludes(await deps.fs.readFile('/app/assets/skin.css'), 'red');
  await updateUiRegistry('/app', [], deps);
  assertEquals((await readUiConfig('/app', deps.fs)).style, 'fixture-style');
  assertStringIncludes(await deps.fs.readFile('/app/components/ui/x.ts'), '= 2');
});

Deno.test('style diff reports retired file removals without changing the app', async () => {
  const deps = await fixture();
  const before = new Map(deps.fs.getFiles());
  const result = await installUiRegistry(
    { root: '/app', names: ['fixture-style'], diff: true },
    deps,
  );
  assertStringIncludes(
    result.diffs.find((diff) => diff.path === 'assets/obsolete.css')!.registryDiff,
    '-.obsolete {}',
  );
  assertEquals(deps.fs.getFiles(), before);
});
