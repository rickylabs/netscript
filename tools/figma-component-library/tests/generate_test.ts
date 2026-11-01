import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { generateLibrary } from '../src/generate.ts';
import { resolveInventory } from '../src/inventory.ts';
import { expandTokenRole, resolveBindings } from '../src/token-bindings.ts';
import { serializeLibrary, validateLibrary } from '../src/validate-library.ts';
import { defaultLibraryInput } from '../src/default-sources.ts';
import { fixtureCatalog, fixtureCollections, fixtureInput, fixtureRegistry } from './fixture.ts';
import { componentContracts } from '../../../packages/fresh-ui/contracts.ts';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';

Deno.test('generation preserves exact registry identity, scoped axes, metadata and JSON round trip', () => {
  const source = fixtureInput();
  const before = serializeLibrary(source);
  const result = generateLibrary(source);
  assertEquals(serializeLibrary(source), before);
  const component = result.components[0];
  assertEquals(component.item, 'example-button');
  assertEquals(component.registryItem, 'fixture-button');
  assertEquals(component.source, 'components/fixture-button.tsx');
  assertEquals(component.axes.map((a) => [a.property, a.parts]), [
    ['data-size', ['label']],
    ['data-state', ['root']],
  ]);
  assertEquals(component.variants.map((v) => v.name), [
    'data-size=sm, data-state=rest',
    'data-size=sm, data-state=disabled',
    'data-size=md, data-state=rest',
    'data-size=md, data-state=disabled',
  ]);
  assertEquals(component.contract.attributes['data-size'].plannedValues, ['sm']);
  assertEquals(component.bindings.map((b) => [b.collection, b.variable, b.field]), [
    ['Theme set', 'radius/control', 'itemSpacing'],
    ['Scheme', 'text/fg', 'fills'],
  ]);
  assert(result.coverage.complete);
  assertEquals(result.coverage.unregisteredContracts, [
    { name: 'unregistered-planned', shipped: false },
    { name: 'unregistered-shipped', shipped: true },
  ]);
  assertEquals(result.components.length, 1);
  assertEquals(validateLibrary(JSON.parse(serializeLibrary(result)), source), result);
  assertEquals(serializeLibrary(generateLibrary(source)), serializeLibrary(result));
});

Deno.test('all malformed contracts fail even when selected item is valid', () => {
  const catalog = fixtureCatalog();
  const c = catalog.components[0];
  const cases = [
    { ...catalog, schemaVersion: 9 },
    { ...catalog, components: [c, c] },
    { ...catalog, components: [{ ...c, extra: true }] },
    { ...catalog, components: [{ ...c, parts: [{ name: 'root' }, { name: 'root' }] }] },
    { ...catalog, components: [{ ...c, attributes: { 'data-state': { values: [] } } }] },
    { ...catalog, components: [{ ...c, attributes: { 'data-state': { values: ['x', 'x'] } } }] },
    { ...catalog, components: [{ ...c, attributes: { 'data-state': { values: ['x,y'] } } }] },
    {
      ...catalog,
      components: [{ ...c, attributes: { 'data-state': { values: ['x'], default: 'y' } } }],
    },
    {
      ...catalog,
      components: [{ ...c, attributes: { 'data-state': { values: ['x'], parts: ['lost'] } } }],
    },
    { ...catalog, components: [{ ...c, slots: [{ name: 'label', part: 'lost' }] }] },
    { ...catalog, components: [{ ...c, booleans: ['missing'] }] },
  ];
  const reasons = [
    'schemaVersion',
    'Duplicate contract name',
    'extra',
    'Duplicate example-button part',
    'values',
    'Duplicate values',
    'values',
    'Unknown default',
    'Unknown part',
    'Unknown slot part',
    'Unknown visibility prop',
  ];
  for (const [index, bad] of cases.entries()) {
    assertThrows(() => generateLibrary({ ...fixtureInput(), catalog: bad }), Error, reasons[index]);
  }
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        catalog: { ...catalog, components: [{ ...c, parts: [{ name: 'label' }] }] },
      }),
    Error,
    'Missing root part',
  );
  assertThrows(
    () =>
      generateLibrary({
        ...fixtureInput(),
        catalog: {
          ...catalog,
          components: [{ ...c, attributes: { 'data-state': { values: ['rest', ' rest'] } } }],
        },
      }),
    Error,
    'Untrimmed variant value',
  );
});

Deno.test('inventory rejects missing/unknown/duplicate registry mappings and stale identity aliases', () => {
  const source = fixtureInput();
  const registry = fixtureRegistry();
  const reasons = [
    'Duplicate registry item',
    'Unknown registry mapping',
    'Missing contract',
    'Duplicate source mapping',
  ];
  const badRegistries = [
    { ...registry, items: [...registry.items, registry.items[1]] },
    { ...registry, items: [registry.items[0]] },
    {
      ...registry,
      items: [
        { ...registry.items[0], meta: { components: { unknown: 'fixture-button' } } },
        registry.items[1],
      ],
    },
    {
      ...registry,
      items: [{
        ...registry.items[0],
        meta: { components: { 'example-button': 'fixture-button', other: 'fixture-button' } },
      }, registry.items[1]],
    },
  ];
  for (const [index, registryInput] of badRegistries.entries()) {
    assertThrows(
      () => generateLibrary({ ...source, registry: registryInput }),
      Error,
      reasons[index],
    );
  }
  assertThrows(
    () => generateLibrary({ ...source, aliases: { missing: 'example-button' } }),
    Error,
    'Unknown or stale contract alias',
  );
  assertThrows(
    () => generateLibrary({ ...source, aliases: { 'example-button': 'example-button' } }),
    Error,
    'Stale contract alias',
  );
  assertThrows(
    () => generateLibrary(source, { items: ['unknown'] }),
    Error,
    'Unknown selected item',
  );
  assertThrows(
    () => generateLibrary(source, { items: ['example-button', 'example-button'] }),
    Error,
    'Duplicate selected item',
  );
  assertThrows(() => generateLibrary(source, { items: [] }), Error, 'Empty component selection');
});

Deno.test('source token gaps, unknown aliases and malformed roles never produce a partial bundle', () => {
  const source = fixtureInput();
  assertThrows(
    () => generateLibrary({ ...source, collections: fixtureCollections().slice(0, 1) }),
    Error,
    'Missing token binding',
  );
  const catalog = fixtureCatalog();
  for (
    const [role, reason] of [
      ['radius/unknown', 'Missing token binding'],
      ['chart/5..1', 'Invalid token role range'],
      ['chart/01..03', 'leading zeros'],
      ['radius/control|', 'Malformed token role segment'],
      ['XX:radius/control', 'Malformed token role segment'],
      ['radius/control|control', 'Duplicate token role expansion'],
    ]
  ) {
    assertThrows(
      () =>
        generateLibrary({
          ...source,
          catalog: { ...catalog, components: [{ ...catalog.components[0], tokenRoles: [role] }] },
        }),
      Error,
      reason,
    );
  }
});

Deno.test('missing, duplicate, unknown and modified output components or bindings fail coverage validation', () => {
  const source = fixtureInput();
  const good = generateLibrary(source);
  const component = good.components[0];
  for (
    const bad of [
      { ...good, components: [] },
      { ...good, components: [component, component] },
      { ...good, components: [{ ...component, registryItem: 'unrelated' }] },
      { ...good, components: [{ ...component, bindings: [] }] },
      { ...good, components: [{ ...component, variants: component.variants.slice(1) }] },
      { ...good, components: [{ ...component, axes: [] }] },
      {
        ...good,
        components: [{
          ...component,
          bindings: [{ ...component.bindings[0], variable: 'unknown' }],
        }],
      },
      { ...good, coverage: { ...good.coverage, available: [] } },
      { ...good, extra: true },
    ]
  ) assertThrows(() => validateLibrary(bad, source), Error, 'Library differs');
  assertThrows(
    () => validateLibrary({ ...good, coverage: { ...good.coverage, selected: [] } }, source),
    Error,
    'selected',
  );
});

Deno.test('role grammar resolves numeric ranges, SF namespace and app-shell suffix shorthand exactly', () => {
  assertEquals(expandTokenRole('chart/1..5'), [
    'chart/1',
    'chart/2',
    'chart/3',
    'chart/4',
    'chart/5',
  ]);
  assertEquals(expandTokenRole('space/page/padding-x|y'), [
    'space/page/padding-x',
    'space/page/padding-y',
  ]);
  const shell = componentContracts.components.find((c) => c.name === 'app-shell');
  assert(shell);
  const shellBindings = resolveBindings(shell.tokenRoles, collections);
  assert(
    shellBindings.some((b) => b.collection === 'Density' && b.variable === 'space/page/padding-y'),
  );
  const namespace = resolveBindings(['SF:deco/sparkline'], collections);
  assertEquals(namespace[0].collection, 'Theme set');
});

Deno.test('current inventory is dynamic; every eligible item generates or exposes the exact source gap', () => {
  const source = defaultLibraryInput();
  const inventory = resolveInventory(source);
  assert(inventory.entries.length > 0);
  const mapped = inventory.entries.map((e) => e.contract.name);
  const deferred = inventory.coverage.unregisteredContracts;
  assertEquals(
    [...mapped, ...deferred.map((c) => c.name)].sort(),
    componentContracts.components.map((c) => c.name).sort(),
  );
  assertEquals(mapped.filter((name) => deferred.some((c) => c.name === name)), []);
  for (const c of deferred) {
    assertEquals(
      c.shipped,
      componentContracts.components.find((s) => s.name === c.name)?.shipped,
    );
  }
  const gaps: string[] = [];
  for (const entry of inventory.entries) {
    try {
      const result = generateLibrary(source, { items: [entry.item] });
      assertEquals(result.components[0].registryItem, entry.sourceItem.name);
      assertEquals(result.components[0].contract.name, entry.contract.name);
      assertEquals(result.coverage.selected, [entry.item]);
      assertEquals(result.coverage.complete, inventory.entries.length === 1);
    } catch (error) {
      if (
        entry.contract.name !== 'prose' || !(error instanceof Error) ||
        !error.message.includes('prose/h4/tracking')
      ) throw error;
      gaps.push(`${entry.item}: ${error.message}`);
    }
  }
  if (gaps.length) {
    console.log('CURRENT SOURCE BLOCKER (full library UNPROVEN): ' + gaps.join('; '));
    assertThrows(() => generateLibrary(source), Error, 'prose/h4/tracking');
  } else {
    const result = generateLibrary(source);
    assertEquals(result.coverage.selected, inventory.entries.map((entry) => entry.item));
    assert(result.coverage.complete);
  }
});

Deno.test('zero-attribute component remains a single identity and large Cartesian products fail', () => {
  const source = fixtureInput();
  const catalog = fixtureCatalog();
  const component = catalog.components[0];
  const reordered = {
    ...catalog,
    components: [{
      ...component,
      attributes: { 'data-state': { values: ['rest', 'disabled'], default: 'disabled' } },
    }],
  };
  assertEquals(
    generateLibrary({ ...source, catalog: reordered }).components[0].variants[0].attributes,
    { 'data-state': 'disabled' },
  );
  const noAxes = { ...catalog, components: [{ ...component, attributes: {} }] };
  assertEquals(generateLibrary({ ...source, catalog: noAxes }).components[0].variants, [{
    name: 'default',
    attributes: {},
  }]);
  const huge = {
    ...catalog,
    components: [{
      ...component,
      attributes: {
        'data-one': { values: Array.from({ length: 33 }, (_, i) => String(i)) },
        'data-two': { values: Array.from({ length: 33 }, (_, i) => String(i)) },
      },
    }],
  };
  assertThrows(() => generateLibrary({ ...source, catalog: huge }), Error, 'variant limit');
});
