import { assert, assertEquals } from '@std/assert';
import { componentContracts, serializeComponentContracts } from '../../contracts.ts';

const CATEGORY_IDS: Readonly<Record<string, number>> = {
  A: 7,
  F: 16,
  N: 10,
  O: 10,
  D: 14,
  B: 7,
  Z: 1,
  L: 12,
  I: 12,
  K: 6,
  X: 9,
};

Deno.test('catalog covers every owner-approved Figma category in priority order', () => {
  const ids = componentContracts.components.map((component) => component.specId);
  assertEquals(ids.length, 104);
  assertEquals(new Set(ids).size, ids.length);
  assertEquals(new Set(componentContracts.components.map((c) => c.name)).size, ids.length);
  for (const [prefix, count] of Object.entries(CATEGORY_IDS)) {
    for (let index = 1; index <= count; index++) assert(ids.includes(`${prefix}${index}`));
  }
  assertEquals(componentContracts.components.filter((c) => c.shipped).length, 96);
  assert(ids.includes('I6'));
  assert(ids.includes('L10'));
  assertEquals(componentContracts.components.filter((c) => !c.shipped).length, 8);
});

Deno.test('contracts are self-consistent and losslessly serializable', () => {
  for (const component of componentContracts.components) {
    const names = component.parts.map((part) => part.name);
    assertEquals(new Set(names).size, names.length, component.name);
    assert(names.includes('root'), `${component.name}: root is explicit, including context roots`);
    for (const name of names) assert(/^[a-z][a-z0-9-]*$/.test(name), name);
    for (const slot of component.slots) assert(names.includes(slot.part), slot.part);
    for (const boolean of component.booleans) assert(component.props[boolean], boolean);
    for (const [attribute, axis] of Object.entries(component.attributes)) {
      assert(attribute.startsWith('data-'));
      assert(axis.values.length > 0);
      assertEquals(new Set(axis.values).size, axis.values.length);
      if (axis.default) assert(axis.values.includes(axis.default));
      for (const planned of axis.plannedValues ?? []) assert(axis.values.includes(planned));
      for (const part of axis.parts ?? []) assert(names.includes(part));
    }
    assert(component.apg.length > 0);
    assert(component.tokenRoles.length > 0);
  }
  assertEquals(JSON.parse(serializeComponentContracts(componentContracts)), componentContracts);
});

Deno.test('checked JSON export matches the typed public catalog', async () => {
  const json = await Deno.readTextFile(new URL('../../contracts.json', import.meta.url));
  assertEquals(JSON.parse(json), componentContracts);
});
