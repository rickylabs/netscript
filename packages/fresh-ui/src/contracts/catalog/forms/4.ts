import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_4: readonly ComponentContract[] = [
  {
    'name': 'input-otp',
    'specId': 'F10',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'length': {
        'kind': 'enum',
        'values': [
          '4',
          '6',
        ],
      },
      'groups': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
      },
      'content': {
        'kind': 'enum',
        'values': [
          'empty',
          'value',
          'caret',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'focus',
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
        'name': 'group',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'slot',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
    ],
    'attributes': {
      'data-length': {
        'values': [
          '4',
          '6',
        ],
      },
      'data-groups': {
        'values': [
          '1',
          '2',
        ],
      },
      'data-content': {
        'values': [
          'empty',
          'value',
          'caret',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'focus',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native one-time-code input',
    'keyboard': [],
    'tokenRoles': [
      'border/input',
      'destructive/default',
      'radius/input',
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'slider',
    'specId': 'F11',
    'category': 'Forms',
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
      'thumbs': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
        ],
      },
      'value': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'track',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'range',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'thumb',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'value-label',
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
      'data-thumbs': {
        'values': [
          '1',
          '2',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'value',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Increment or decrement',
      },
      {
        'key': 'Home/End',
        'action': 'Minimum or maximum',
      },
    ],
    'tokenRoles': [
      'material/track',
      'primary/default',
      'surface/card',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'combobox',
    'specId': 'F12',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'multiple': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
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
      },
      {
        'name': 'input',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'empty',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-multiple': {
        'values': [
          'false',
          'true',
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
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    'keyboard': [
      {
        'key': 'ArrowDown/ArrowUp',
        'action': 'Navigate options',
      },
      {
        'key': 'Enter',
        'action': 'Select option',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss options',
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
