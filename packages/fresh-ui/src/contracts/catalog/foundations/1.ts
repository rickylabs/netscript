import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const foundations_1: readonly ComponentContract[] = [
  {
    'name': 'icon',
    'specId': 'Z1',
    'category': 'Foundations',
    'priority': 'P0',
    'shipped': true,
    'props': {},
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'glyph',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {},
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'text/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
