import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_2: readonly ComponentContract[] = [
  {
    'name': 'select',
    'specId': 'F4',
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
      'content': {
        'kind': 'enum',
        'values': [
          'placeholder',
          'value',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
          'disabled',
          'invalid',
        ],
      },
      'options': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'selectedValues': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'error': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'multiple': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'iconStart': {
        'kind': 'boolean',
      },
      'value': {
        'kind': 'text',
      },
      'placeholder': {
        'kind': 'text',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon-start',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value',
        'representation': 'native',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
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
        'plannedValues': [
          'sm',
        ],
      },
      'data-content': {
        'values': [
          'placeholder',
          'value',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'plannedValues': [
          'open',
        ],
      },
    },
    'booleans': [
      'iconStart',
    ],
    'slots': [],
    'apg': 'native select',
    'keyboard': [
      {
        'key': 'ArrowUp/ArrowDown',
        'action': 'Navigate native options',
      },
      {
        'key': 'Enter/Space',
        'action': 'Open or commit native selection',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss native picker',
      },
    ],
    'tokenRoles': [
      'border/control',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Text and value anatomy is native control content; custom adornments remain planned.',
    ],
  },
  {
    'name': 'checkbox',
    'specId': 'F5',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'checked': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
          'invalid',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'defaultChecked': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'error': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'label': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'control',
      },
      {
        'name': 'indicator',
      },
      {
        'name': 'body',
      },
      {
        'name': 'label',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-checked': {
        'values': [
          'false',
          'true',
          'indeterminate',
        ],
        'description':
          'Initial/controlled render value. Uncontrolled live state follows the native input checked property and :checked, without listener-based attribute synchronization.',
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'label',
      'description',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    'keyboard': [
      {
        'key': 'Space',
        'action': 'Toggle checked',
      },
    ],
    'tokenRoles': [
      'border/control',
      'border/input',
      'border/width',
      'destructive/default',
      'primary/default',
      'primary/fg',
      'surface/card',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'radio-group',
    'specId': 'F6',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
          'invalid',
        ],
      },
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'name': {
        'kind': 'text',
        'required': true,
      },
      'legend': {
        'kind': 'slot',
        'required': true,
      },
      'options': {
        'kind': 'collection',
        'required': true,
      },
      'value': {
        'kind': 'text',
      },
      'defaultValue': {
        'kind': 'text',
      },
      'onValueChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'required': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'control',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-checked': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'control',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'root',
          'control',
        ],
      },
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Move focus and selection',
      },
      {
        'key': 'Space',
        'action': 'Select focused radio',
      },
    ],
    'tokenRoles': [
      'border/input',
      'primary/default',
      'size/checkbox',
      'space/stack/gap',
      'surface/card',
    ],
    'notes': [
      'Native controls own keyboard/form behavior. Transient focus/hover is CSS/native; data-state also supports deliberate preview. Client visual/controlled updates require an island.',
      'Design checked belongs to individual Radio controls; the group public API uses value/defaultValue and native name. Disabled fieldset applies to every option.',
    ],
  },
];
