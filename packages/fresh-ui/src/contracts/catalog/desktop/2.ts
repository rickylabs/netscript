import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const desktop_2: readonly ComponentContract[] = [
  {
    'name': 'desktop-notification',
    'specId': 'K4',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'disabled',
        ],
      },
      'action': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'copy',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'action',
    ],
    'slots': [],
    'apg': 'native buttons and links',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused button; links use Enter',
      },
    ],
    'tokenRoles': [
      'space/stack/gap',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'update-prompt',
    'specId': 'K5',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'automatic',
          'manual',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'copy',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'automatic',
          'manual',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native buttons and links',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused button; links use Enter',
      },
    ],
    'tokenRoles': [
      'border/default',
      'info/border',
      'radius/card',
      'space/stack/gap',
      'surface/card',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'desktop-only',
    'specId': 'K6',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
      },
    ],
    'attributes': {},
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'root',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Nonvisual conditional wrapper.',
    ],
  },
];
