import { assertEquals } from '@std/assert';
import { type ComponentContractCatalog, serializeComponentContracts } from '../../contracts.ts';

Deno.test('contract JSON boundary preserves every serializable field deterministically', () => {
  const catalog: ComponentContractCatalog = {
    schemaVersion: 1,
    components: [{
      name: 'sample',
      specId: 'A1',
      category: 'Actions',
      priority: 'P0',
      shipped: true,
      props: {
        variant: {
          kind: 'enum',
          required: false,
          values: ['primary'],
          default: 'primary',
          description: 'Presentation',
        },
      },
      parts: [{ name: 'root' }, {
        name: 'icon',
        when: 'icon supplied',
        representation: 'native',
        planned: true,
      }],
      attributes: {
        'data-variant': {
          values: ['primary', 'link'],
          default: 'primary',
          parts: ['root'],
          plannedValues: ['link'],
          description: 'Shared style axis',
        },
      },
      booleans: ['icon'],
      slots: [{ name: 'icon', part: 'icon' }],
      apg: 'native button',
      keyboard: [{ key: 'Enter', action: 'Activate' }],
      tokenRoles: ['primary/default'],
      notes: ['Test every serializable field'],
    }],
  };
  const json = serializeComponentContracts(catalog);
  assertEquals(JSON.parse(json), catalog);
  assertEquals(serializeComponentContracts(catalog), json);
  assertEquals(json.endsWith('\n'), true);
});
