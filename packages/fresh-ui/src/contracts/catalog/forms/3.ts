import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_3: readonly ComponentContract[] = [
  {
    'name': 'switch',
    'specId': 'F7',
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
        'name': 'track',
      },
      {
        'name': 'thumb',
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
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
        'plannedValues': [
          'sm',
        ],
      },
      'data-checked': {
        'values': [
          'false',
          'true',
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
      },
    },
    'booleans': [
      'label',
      'description',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
    'keyboard': [
      {
        'key': 'Space',
        'action': 'Toggle checked',
      },
    ],
    'tokenRoles': [
      'border/control',
      'border/input',
      'primary/default',
      'surface/card',
      'surface/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'field',
    'specId': 'F8',
    'category': 'Forms',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'vertical',
          'horizontal',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'legend',
          'label',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'invalid',
          'disabled',
        ],
      },
      'name': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'error': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'helpText': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'description': {
        'kind': 'boolean',
      },
      'required': {
        'kind': 'boolean',
      },
      'control': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'control',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'error-row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'error-icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'error',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'legend',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'vertical',
          'horizontal',
        ],
        'plannedValues': [
          'horizontal',
        ],
      },
      'data-variant': {
        'values': [
          'legend',
          'label',
        ],
        'plannedValues': [
          'legend',
          'label',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'invalid',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'description',
      'required',
    ],
    'slots': [
      {
        'name': 'control',
        'part': 'control',
      },
    ],
    'apg': 'native label and form controls',
    'keyboard': [],
    'tokenRoles': [
      'destructive/text',
      'space/inline/gap',
      'space/stack/gap',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Field is the contract name; FormField is the compatible source API.',
    ],
  },
  {
    'name': 'input-group',
    'specId': 'F9',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'align': {
        'kind': 'enum',
        'values': [
          'inline-start',
          'inline-end',
          'block-start',
          'block-end',
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
      'control': {
        'kind': 'slot',
      },
      'addon': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'addon',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'control',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'text',
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
      'data-align': {
        'values': [
          'inline-start',
          'inline-end',
          'block-start',
          'block-end',
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
    'slots': [
      {
        'name': 'control',
        'part': 'control',
      },
      {
        'name': 'addon',
        'part': 'addon',
      },
    ],
    'apg': 'native input group',
    'keyboard': [],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
