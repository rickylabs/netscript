import type { ComponentContractCatalog } from '../../../packages/fresh-ui/contracts.ts';
import type { Registry } from '../../../packages/fresh-ui/registry-v2.ts';
import type { FigmaCollection } from '../../../packages/fresh-ui/tokens.ts';
import type { LibraryInput } from '../src/contract.ts';

/** Synthetic contracts exercise the source grammar without copying any real component specification. */
export function fixtureCatalog(): ComponentContractCatalog {
  return {
    schemaVersion: 1,
    components: [{
      name: 'example-button',
      specId: 'fixture-A1',
      category: 'Fixture',
      priority: 'P0',
      shipped: true,
      props: { label: { kind: 'slot' }, loading: { kind: 'boolean' } },
      parts: [{ name: 'root' }, { name: 'label' }, {
        name: 'decoration',
        representation: 'pseudo',
      }],
      attributes: {
        'data-state': { values: ['rest', 'disabled'], default: 'rest' },
        'data-size': { values: ['sm', 'md'], parts: ['label'], plannedValues: ['sm'] },
      },
      booleans: ['loading'],
      slots: [{ name: 'label', part: 'label' }],
      apg: 'native button',
      keyboard: [{ key: 'Enter', action: 'Activate' }],
      tokenRoles: ['text/fg', 'radius/control'],
      notes: [],
    }, {
      name: 'unregistered-shipped',
      specId: 'fixture-B1',
      category: 'Fixture',
      priority: 'P1',
      shipped: true,
      props: {},
      parts: [{ name: 'root' }],
      attributes: {},
      booleans: [],
      slots: [],
      apg: 'noninteractive',
      keyboard: [],
      tokenRoles: [],
      notes: [],
    }, {
      name: 'unregistered-planned',
      specId: 'fixture-B2',
      category: 'Fixture',
      priority: 'P2',
      shipped: false,
      props: {},
      parts: [{ name: 'root' }],
      attributes: {},
      booleans: [],
      slots: [],
      apg: 'noninteractive',
      keyboard: [],
      tokenRoles: [],
      notes: [],
    }],
  };
}

/** The logical id intentionally differs from the physical registry id. */
export function fixtureRegistry(): Registry {
  return {
    name: 'fixture',
    items: [{
      name: 'style-fixture',
      type: 'registry:style',
      meta: { components: { 'example-button': 'fixture-button' } },
    }, {
      name: 'fixture-button',
      type: 'registry:component',
      files: [{ path: 'components/fixture-button.tsx', type: 'registry:component' }],
    }],
  };
}

/** Figma-owned values are fixtures; component generation uses identities only. */
export function fixtureCollections(): readonly FigmaCollection[] {
  return [{
    collection: 'Scheme',
    modes: ['Light', 'Dark'],
    variables: [{
      name: 'text/fg',
      type: 'COLOR',
      codeSyntax: 'var(--ns-fg)',
      scopes: ['TEXT_FILL'],
      values: { Light: '#121212', Dark: '#eeeeee' },
    }],
  }, {
    collection: 'Theme set',
    modes: ['A', 'B'],
    variables: [{
      name: 'radius/control',
      type: 'FLOAT',
      scopes: ['CORNER_RADIUS'],
      values: { A: 4, B: 0 },
    }],
  }];
}

/** Return independent input trees for malformed-input and round-trip controls. */
export function fixtureInput(): LibraryInput {
  return {
    catalog: fixtureCatalog(),
    registry: fixtureRegistry(),
    collections: fixtureCollections(),
    style: 'style-fixture',
    aliases: {},
  };
}
