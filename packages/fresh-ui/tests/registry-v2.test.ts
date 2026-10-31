import { assertEquals, assertThrows } from '@std/assert';
import authored from '../registry.json' with { type: 'json' };
import { REGISTRY_ITEM_TYPES, validateRegistry, validateRegistryItem } from '../registry-v2.ts';

Deno.test('authored Fresh UI registry validates against the published registry and item schemas', () => {
  const registry = validateRegistry(authored);
  assertEquals<unknown>(registry.items, authored.items);
  for (const item of registry.items) assertEquals(validateRegistryItem(item), item);
});

Deno.test('published schema rejects broken item types, files, variables and required font metadata', () => {
  for (
    const item of [
      { name: 'broken', type: 'registry:made-up' },
      { name: 'broken', type: 'registry:file', files: [{ path: 'x', type: 'registry:file' }] },
      { name: 'broken', type: 'registry:theme', cssVars: { light: { background: 1 } } },
      { name: 'broken', type: 'registry:font' },
    ]
  ) assertThrows(() => validateRegistry({ items: [item] }), Error, 'Invalid registry');
});

Deno.test('protocol supports all twelve upstream categories and duplicate-name rejection', () => {
  assertEquals(REGISTRY_ITEM_TYPES.length, 12);
  for (const type of REGISTRY_ITEM_TYPES.filter((type) => type !== 'registry:font')) {
    assertEquals(validateRegistryItem({ name: 'valid', type }).type, type);
  }
  assertThrows(
    () => validateRegistry({ items: [authored.items[0], authored.items[0]] }),
    Error,
    'Duplicate',
  );
  assertThrows(
    () => validateRegistryItem({ name: '../escape', type: 'registry:file' }),
    Error,
    'path separators',
  );
});
