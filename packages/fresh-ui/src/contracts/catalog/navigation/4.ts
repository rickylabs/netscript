import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const navigation_4: readonly ComponentContract[] = [
  {
    'name': 'sidebar-toggle',
    'specId': 'N10',
    'category': 'Navigation',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
    ],
    'attributes': {
      'data-open': {
        'values': [
          'false',
          'true',
        ],
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
