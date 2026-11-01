import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { UiConfigSchema, uiRegistryUrl } from '../../../../domain/ui/ui-config.ts';
import { uiContentHash, uiFileDiff } from '../../../../domain/ui/ui-lock.ts';
import { readUiConfig, readUiLock, writeUiMetadata } from '../config-lock.ts';
import { planUiWrites } from '../ui-write-plan.ts';

Deno.test('app config preserves unresolved headers, validates aliases and normalizes GitHub sources', async () => {
  const fs = new MemoryFileSystemAdapter();
  const config = UiConfigSchema.parse({
    registries: {
      '@acme': {
        url: 'https://example.com/r/{name}.json',
        headers: { Authorization: 'Bearer ${ACME_TOKEN}' },
      },
    },
  });
  assertEquals(await readUiLock('/app', fs), undefined);
  await writeUiMetadata('/app', config, { version: 1, items: {} }, fs);
  assertEquals(await readUiConfig('/app', fs), config);
  assertEquals((await readUiLock('/app', fs))?.items, {});
  assertStringIncludes(await fs.readFile('/app/components.json'), '${ACME_TOKEN}');
  for (const alias of ['../outside', '/outside', 'C:\\outside', '.git/config']) {
    assertThrows(() => UiConfigSchema.parse({ aliases: { ui: alias } }));
  }
  assertEquals(
    uiRegistryUrl('github:acme/ui'),
    'https://raw.githubusercontent.com/acme/ui/HEAD/registry.json',
  );
  assertEquals(
    uiRegistryUrl('https://github.com/acme/ui/tree/main/sources'),
    'https://raw.githubusercontent.com/acme/ui/main/sources/registry.json',
  );
  for (
    const url of [
      'file:///etc/passwd',
      'https://user:secret@example.com/r/x.json',
      'https://example.com/r/x.json?token=secret',
    ]
  ) assertThrows(() => uiRegistryUrl(url));
});

Deno.test('lock baseline supports a readable local edit diff and rejects malformed metadata', async () => {
  const fs = new MemoryFileSystemAdapter();
  const content = 'export const label = "registry";\n';
  const hash = await uiContentHash(content);
  const lock = {
    version: 1 as const,
    items: {
      x: {
        source: 'builtin:x',
        sourceHash: hash,
        type: 'registry:ui',
        requested: true,
        registryDependencies: [],
        files: [{ target: 'components/ui/x.ts', hash, content, managed: false }],
      },
    },
  };
  await writeUiMetadata('/app', UiConfigSchema.parse({}), lock, fs);
  assertEquals(await readUiLock('/app', fs), lock);
  const diff = uiFileDiff(content, content.replace('registry', 'local edit'), 'components/ui/x.ts');
  assertStringIncludes(diff, '-export const label = "registry";');
  assertStringIncludes(diff, '+export const label = "local edit";');
  assertEquals(uiFileDiff(content, content, 'x'), '');
  assertStringIncludes(uiFileDiff('x\n', 'x', 'x.ts'), '\\ No newline at end of file');
  const appended = uiFileDiff('a\nb', 'a\nb\nc\n', 'x.ts');
  assertStringIncludes(appended, '-b\n\\ No newline at end of file\n+b\n+c');
  await fs.writeFile(
    '/app/fresh-ui.lock.json',
    JSON.stringify({
      ...lock,
      items: {
        x: {
          ...lock.items.x,
          files: [{ ...lock.items.x.files[0], content: 'corrupted baseline' }],
        },
      },
    }),
  );
  await assertRejects(() => readUiLock('/app', fs), Error, 'baseline hash');
  await fs.writeFile('/app/fresh-ui.lock.json', JSON.stringify({ ...lock, version: 0 }));
  await assertRejects(() => readUiLock('/app', fs));
});

Deno.test('staging exposes planned bytes but preflights every destination before writing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/keep.ts', 'existing');
  const plan = planUiWrites('/app', fs);
  await plan.fs.writeFile('/app/one.ts', 'one');
  await plan.fs.writeFile('/app/two.ts', 'two');
  assertEquals(await plan.fs.readFile('/app/one.ts'), 'one');
  assertEquals(await fs.exists('/app/one.ts'), false);
  await assertRejects(
    () =>
      plan.commit({
        assertContained: (_root, path) =>
          path.endsWith('two.ts')
            ? Promise.reject(new Error('unsafe destination'))
            : Promise.resolve(),
      }),
    Error,
    'unsafe',
  );
  assertEquals([...fs.getFiles()], [['/app/keep.ts', 'existing']]);
  await plan.commit();
  assertEquals(await fs.readFile('/app/one.ts'), 'one');
});
