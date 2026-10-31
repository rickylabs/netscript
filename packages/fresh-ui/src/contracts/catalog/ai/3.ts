import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const ai_3: readonly ComponentContract[] = [
  {
    'name': 'mcp-ui-widget',
    'specId': 'I12',
    'category': 'AI',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'loading',
          'ready',
          'error',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'frame',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'loading',
          'ready',
          'error',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'radius/card',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
