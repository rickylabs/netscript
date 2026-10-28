import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_1: readonly ComponentContract[] = [
  {
    'name': 'label',
    'specId': 'F1',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'eyebrow',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'disabled',
          'invalid',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'srOnly': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'required': {
        'kind': 'boolean',
      },
      'optional': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'text',
      },
      {
        'name': 'required-mark',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'pseudo',
      },
      {
        'name': 'optional-hint',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'eyebrow',
        ],
        'plannedValues': [
          'eyebrow',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'disabled',
          'invalid',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'required',
      'optional',
    ],
    'slots': [],
    'apg': 'native label',
    'keyboard': [],
    'tokenRoles': [
      'destructive/text',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'input',
    'specId': 'F2',
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
          'disabled',
          'invalid',
          'invalid-focus',
        ],
      },
      'type': {
        'kind': 'enum',
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
      'iconStart': {
        'kind': 'boolean',
      },
      'iconEnd': {
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
        'name': 'text',
        'representation': 'native',
      },
      {
        'name': 'icon-end',
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
          'disabled',
          'invalid',
          'invalid-focus',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'iconStart',
      'iconEnd',
    ],
    'slots': [],
    'apg': 'native input',
    'keyboard': [
      {
        'key': 'Printable keys',
        'action': 'Edit value using native text editing',
      },
      {
        'key': 'Tab',
        'action': 'Move focus',
      },
    ],
    'tokenRoles': [
      'border/control',
      'border/default',
      'border/input',
      'border/width',
      'radius/input',
      'surface/card',
      'surface/muted',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Text and value anatomy is native control content; custom adornments remain planned.',
    ],
  },
  {
    'name': 'textarea',
    'specId': 'F3',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
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
          'disabled',
          'invalid',
          'invalid-focus',
        ],
      },
      'error': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'counter': {
        'kind': 'boolean',
      },
      'resize': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'text',
        'representation': 'native',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'counter',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'resize-handle',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
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
          'disabled',
          'invalid',
          'invalid-focus',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'counter',
      'resize',
    ],
    'slots': [],
    'apg': 'native textarea',
    'keyboard': [
      {
        'key': 'Enter',
        'action': 'Insert newline',
      },
      {
        'key': 'Printable keys',
        'action': 'Edit value using native text editing',
      },
    ],
    'tokenRoles': [
      'radius/input',
      'space/stack/gap',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Text and value anatomy is native control content; custom adornments remain planned.',
    ],
  },
];
