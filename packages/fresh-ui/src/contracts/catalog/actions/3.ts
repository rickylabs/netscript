import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const actions_3: readonly ComponentContract[] = [
  {
    'name': 'theme-toggle',
    'specId': 'A7',
    'category': 'Actions',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'theme': {
        'kind': 'enum',
        'values': [
          'light',
          'dark',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
    ],
    'attributes': {
      'data-theme': {
        'values': [
          'light',
          'dark',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    'keyboard': [
      {
        'key': 'Enter',
        'action': 'Activate',
      },
      {
        'key': 'Space',
        'action': 'Activate button; links use native Enter',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
