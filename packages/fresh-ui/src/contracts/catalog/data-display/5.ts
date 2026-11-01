import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_5: readonly ComponentContract[] = [
  {
    'name': 'collapsible',
    'specId': 'D13',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': false,
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
        'planned': true,
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
        'planned': true,
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
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle disclosure',
      },
    ],
    'tokenRoles': [
      'space/stack/gap',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'carousel',
    'specId': 'D14',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'controls': {
        'kind': 'enum',
        'values': [
          'outside',
          'inside',
        ],
      },
      'dots': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'viewport',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'slide',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'previous',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'next',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'dots',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
        'planned': true,
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'data-controls': {
        'values': [
          'outside',
          'inside',
        ],
      },
    },
    'booleans': [
      'dots',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus previous/next controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate control',
      },
    ],
    'tokenRoles': [
      'border/strong',
      'space/stack/gap',
      'text/fg',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
