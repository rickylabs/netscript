import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const layout_blocks_3: readonly ComponentContract[] = [
  {
    'name': 'separator',
    'specId': 'L7',
    'category': 'Layout & blocks',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'subtle',
          'default',
          'strong',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'data-variant': {
        'values': [
          'subtle',
          'default',
          'strong',
        ],
        'plannedValues': [
          'subtle',
          'strong',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'border/strong',
      'border/subtle',
      'border/width',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'section-divider',
    'specId': 'L8',
    'category': 'Layout & blocks',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'align': {
        'kind': 'enum',
        'values': [
          'start',
          'center',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'label',
      },
      {
        'name': 'line',
      },
    ],
    'attributes': {
      'data-align': {
        'values': [
          'start',
          'center',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'border/width',
      'space/inline/gap',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
