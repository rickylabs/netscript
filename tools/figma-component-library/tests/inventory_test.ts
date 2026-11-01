import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { generateLibrary } from '../src/generate.ts';
import { fixtureCatalog, fixtureInput, fixtureRegistry } from './fixture.ts';

Deno.test('distinct source items cannot claim one logical contract twice', () => {
  const registry = fixtureRegistry();
  const duplicate = {
    ...registry,
    items: [
      {
        ...registry.items[0],
        meta: { components: { 'example-button': 'fixture-button', 'alt-button': 'alt-button' } },
      },
      registry.items[1],
      { ...registry.items[1], name: 'alt-button' },
    ],
  };
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        registry: duplicate,
        aliases: { 'alt-button': 'example-button' },
      }),
    Error,
    'Duplicate contract mapping',
  );
});

Deno.test('unmapped visual inventory and missing style entries fail rather than silently shrink coverage', () => {
  const registry = fixtureRegistry();
  const newItem = { ...registry.items[1], name: 'unregistered-shipped' };
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        registry: { ...registry, items: [...registry.items, newItem] },
      }),
    Error,
    'Unmapped registry component',
  );
  const otherStyle = {
    ...registry.items[0],
    name: 'style-other',
    meta: {
      components: {
        'unregistered-shipped': 'unregistered-shipped',
        'example-button': 'fixture-button',
      },
    },
  };
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        registry: { ...registry, items: [...registry.items, newItem, otherStyle] },
      }),
    Error,
    'Missing style mapping',
  );
});

Deno.test('new registry component joins inventory automatically when its existing contract/source map is complete', () => {
  const registry = fixtureRegistry();
  const input = {
    ...fixtureInput(),
    registry: {
      ...registry,
      items: [
        {
          ...registry.items[0],
          meta: {
            components: {
              'example-button': 'fixture-button',
              'unregistered-shipped': 'unregistered-shipped',
            },
          },
        },
        registry.items[1],
        { ...registry.items[1], name: 'unregistered-shipped' },
      ],
    },
  };
  const result = generateLibrary(input);
  assertEquals(result.components.map((c) => c.item), ['example-button', 'unregistered-shipped']);
  assertEquals(result.coverage.unregisteredContracts, [{
    name: 'unregistered-planned',
    shipped: false,
  }]);
  const selected = generateLibrary(input, { items: ['example-button'] });
  assertEquals(selected.coverage.complete, false);
  assertEquals(selected.coverage.omitted, ['unregistered-shipped']);
});

Deno.test('ambiguous implementation sources and malformed unselected role grammar are rejected', () => {
  const registry = fixtureRegistry();
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        registry: {
          ...registry,
          items: [registry.items[0], {
            ...registry.items[1],
            files: [...registry.items[1].files ?? [], {
              path: 'other.tsx',
              type: 'registry:component',
            }],
          }],
        },
      }),
    Error,
    'Ambiguous component source',
  );
  const catalog = fixtureCatalog();
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        catalog: {
          ...catalog,
          components: catalog.components.map((c) =>
            c.name === 'unregistered-shipped' ? { ...c, tokenRoles: ['bad|'] } : c
          ),
        },
      }, { items: ['example-button'] }),
    Error,
    'Malformed token role segment',
  );
});
