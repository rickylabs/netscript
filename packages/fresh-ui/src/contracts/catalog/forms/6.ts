import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_6: readonly ComponentContract[] = [
  {
    'name': 'dropzone',
    'specId': 'F16',
    'category': 'Forms',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'active',
          'focus',
          'disabled',
          'invalid',
        ],
      },
      'icon': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon',
      },
      {
        'name': 'label',
      },
      {
        'name': 'hint',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'input',
      },
      {
        'name': 'status',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'hover',
          'active',
          'focus',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'icon',
        'part': 'icon',
      },
      {
        'name': 'children',
        'part': 'root',
      },
    ],
    'apg': 'native file input',
    'keyboard': [],
    'tokenRoles': [
      'border/strong',
      'border/width',
      'destructive/text',
      'primary/default',
      'radius/card',
      'surface/selected',
      'surface/surface',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
