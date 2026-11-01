import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const navigation_3: readonly ComponentContract[] = [
  {
    'name': 'menubar',
    'specId': 'N7',
    'category': 'Navigation',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
          'disabled',
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
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    'keyboard': [
      {
        'key': 'ArrowLeft/ArrowRight',
        'action': 'Navigate menu triggers',
      },
      {
        'key': 'ArrowDown',
        'action': 'Open menu',
      },
      {
        'key': 'Escape',
        'action': 'Close menu',
      },
    ],
    'tokenRoles': [
      'border/default',
      'radius/input',
      'surface/bg',
      'surface/hover',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'location-marker',
    'specId': 'N8',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': false,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'deco/marker',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'stepper',
    'specId': 'N9',
    'category': 'Navigation',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'status': {
        'kind': 'enum',
        'values': [
          'complete',
          'current',
          'upcoming',
          'error',
        ],
      },
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'description': {
        'kind': 'boolean',
      },
      'connector': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'connector',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
    ],
    'attributes': {
      'data-status': {
        'values': [
          'complete',
          'current',
          'upcoming',
          'error',
        ],
      },
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
    },
    'booleans': [
      'description',
      'connector',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'primary/default',
      'primary/fg',
      'radius/badge',
      'text/muted',
      'topbar/rule',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
