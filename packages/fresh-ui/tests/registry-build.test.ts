import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { buildRegistry, validateRegistry, validateRegistryItem } from '../registry-v2.ts';
import authored from '../registry.json' with { type: 'json' };

Deno.test('static build embeds every built-in source and produces schema-valid deterministic JSON', async () => {
  const root = new URL('../../../', import.meta.url);
  const input = {
    registry: authored,
    readSource: (path: string) => Deno.readTextFile(new URL(path, root)),
  };
  const artifacts = await buildRegistry(input);
  assertEquals(Object.keys(artifacts).length, authored.items.length + 1);
  const catalog = validateRegistry(JSON.parse(artifacts['registry.json']));
  assertEquals(catalog.items.length, authored.items.length);
  for (const item of catalog.items) {
    const payload = validateRegistryItem(JSON.parse(artifacts[`${item.name}.json`]));
    assertEquals(payload.name, item.name);
    for (const file of payload.files ?? []) {
      assertEquals(file.content, await input.readSource(file.path));
    }
  }
  assertEquals(await buildRegistry(input), artifacts);
});

Deno.test('static build resolves registry includes and rejects cycles, broken items and traversal', async () => {
  const registry = {
    name: 'acme',
    homepage: 'https://example.com',
    include: ['parts/registry.json'],
  };
  const artifacts = await buildRegistry({
    registry,
    readSource: (path) =>
      Promise.resolve(
        path.endsWith('.json')
          ? JSON.stringify({
            items: [{
              name: 'x',
              type: 'registry:ui',
              files: [{ path: 'x.ts', type: 'registry:ui' }],
            }],
          })
          : 'export const x = 1;',
      ),
  });
  assertStringIncludes(artifacts['x.json'], 'export const x = 1;');
  await assertRejects(
    () =>
      buildRegistry({
        registry,
        readSource: () => Promise.resolve(JSON.stringify({ include: ['registry.json'] })),
      }),
    Error,
    'cycle',
  );
  await assertRejects(
    () =>
      buildRegistry({
        registry: { ...registry, items: [{ name: 'broken', type: 'bad' }] },
        readSource: () => Promise.resolve(''),
      }),
    Error,
    'Invalid registry',
  );
  await assertRejects(
    () =>
      buildRegistry({
        registry: {
          name: 'x',
          homepage: 'https://example.com',
          items: [{
            name: 'x',
            type: 'registry:file',
            files: [{ path: '../outside', type: 'registry:file', target: 'x' }],
          }],
        },
        readSource: () => Promise.resolve('outside'),
      }),
    Error,
    'relative',
  );
});
