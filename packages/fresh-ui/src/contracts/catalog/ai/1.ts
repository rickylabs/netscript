import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const ai_1: readonly ComponentContract[] = [
  {
    'name': 'message',
    'specId': 'I1',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'role': {
        'kind': 'enum',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'pending',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'avatar': {
        'kind': 'boolean',
      },
      'header': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'boolean',
      },
      'followups': {
        'kind': 'boolean',
      },
      'footer': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'avatar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'main',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'head',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'author',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'model',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'time',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'text',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'followups',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-role': {
        'values': [
          'user',
          'assistant',
          'system',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'pending',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'avatar',
      'header',
      'actions',
      'followups',
      'footer',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'body',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'space/stack/gap',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'bubble',
    'specId': 'I2',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'secondary',
          'muted',
          'tinted',
          'outline',
          'ghost',
          'destructive',
        ],
      },
      'align': {
        'kind': 'enum',
        'values': [
          'start',
          'end',
        ],
      },
      'reactions': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'reactions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'secondary',
          'muted',
          'tinted',
          'outline',
          'ghost',
          'destructive',
        ],
      },
      'data-align': {
        'values': [
          'start',
          'end',
        ],
      },
    },
    'booleans': [
      'reactions',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'accent/subtle',
      'border/default',
      'destructive/subtle',
      'destructive/text',
      'primary/default',
      'primary/fg',
      'radius/card',
      'secondary/default',
      'secondary/fg',
      'space/control/padding-x',
      'surface/muted',
      'text/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'prompt-input',
    'specId': 'I8',
    'category': 'AI',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'focus',
          'busy',
          'disabled',
        ],
      },
      'compact': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'attachments': {
        'kind': 'boolean',
      },
      'tools': {
        'kind': 'slot',
      },
      'hint': {
        'kind': 'boolean',
      },
      'modelSelector': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'slot',
      },
      'submitKey': {
        'kind': 'enum',
        'values': [
          'none',
          'enter',
          'mod-enter',
        ],
        'default': 'none',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'field',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'attachments',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'bar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'tools',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'hint',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'send',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'focus',
          'busy',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
      'data-compact': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [
      'attachments',
      'tools',
      'hint',
      'modelSelector',
    ],
    'slots': [
      {
        'name': 'tools',
        'part': 'tools',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
    ],
    'apg': 'native form, textarea and buttons',
    'keyboard': [
      {
        'key': 'Enter',
        'action':
          'Submit only with submitKey=enter and without Shift/IME composition; otherwise native text entry',
      },
      {
        'key': 'Control+Enter/Meta+Enter',
        'action': 'Submit with submitKey=mod-enter unless composing',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move through textarea and native controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused action button',
      },
    ],
    'tokenRoles': [
      'border/input',
      'radius/card',
      'space/inline/gap',
      'space/stack/gap',
      'surface/card',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Utility compatibility anatomy is included for existing shipped helpers; it does not implement a design gap.',
    ],
  },
];
