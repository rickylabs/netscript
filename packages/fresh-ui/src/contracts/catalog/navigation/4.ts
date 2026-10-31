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
      'class': {
        'kind': 'text',
      },
      'sidebarSelector': {
        'kind': 'text',
        'default': '[data-sidebar]',
      },
      'backdropSelector': {
        'kind': 'text',
        'default': '[data-sidebar-backdrop]',
      },
      'openLabel': {
        'kind': 'text',
        'default': 'Open sidebar',
      },
      'closeLabel': {
        'kind': 'text',
        'default': 'Close sidebar',
      },
      'openIcon': {
        'kind': 'slot',
      },
      'closeIcon': {
        'kind': 'slot',
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
      'data-state': {
        'values': [
          'rest',
        ],
        'default': 'rest',
      },
      'data-variant': {
        'values': [
          'ghost',
        ],
        'default': 'ghost',
      },
      'data-size': {
        'values': [
          'sm',
        ],
        'default': 'sm',
      },
      'data-icon': {
        'values': [
          'true',
        ],
        'default': 'true',
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
      'Audited baseline: open is derived native state, never an accepted prop. Default selectors connect to the nearest shell; explicit overrides retain standalone behavior. aria-controls is absent until the owned target is connected; controlled refusal does not flip aria-expanded.',
    ],
  },
];
