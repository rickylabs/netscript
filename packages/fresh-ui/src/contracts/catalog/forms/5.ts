import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_5: readonly ComponentContract[] = [
  {
    'name': 'calendar',
    'specId': 'F13',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'months': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
      },
      'caption': {
        'kind': 'enum',
        'values': [
          'label',
          'dropdown',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
          'today',
        ],
      },
      'range': {
        'kind': 'enum',
        'values': [
          'none',
          'start',
          'middle',
          'end',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'nav-prev',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'caption',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'nav-next',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'weekdays',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'grid',
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
      'data-months': {
        'values': [
          '1',
          '2',
        ],
      },
      'data-caption': {
        'values': [
          'label',
          'dropdown',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
          'today',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
      'data-range': {
        'values': [
          'none',
          'start',
          'middle',
          'end',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Move between cells',
      },
      {
        'key': 'Home/End',
        'action': 'Move to first/last cell',
      },
    ],
    'tokenRoles': [
      'primary/default',
      'primary/fg',
      'radius/input',
      'surface/muted',
      'surface/selected',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'date-picker',
    'specId': 'F14',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'mode': {
        'kind': 'enum',
        'values': [
          'single',
          'range',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'focus',
          'open',
          'disabled',
          'invalid',
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
      'data-mode': {
        'values': [
          'single',
          'range',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'focus',
          'open',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Cycle focus within modal',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss and restore trigger focus',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'search',
    'specId': 'F15',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
        ],
      },
      'kbd': {
        'kind': 'boolean',
      },
      'label': {
        'kind': 'text',
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
        'name': 'kbd',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'kbd',
    ],
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
      'border/default',
      'border/hover',
      'radius/input',
      'surface/card',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
