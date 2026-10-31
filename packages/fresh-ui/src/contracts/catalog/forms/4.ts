import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_4: readonly ComponentContract[] = [
  {
    'name': 'input-otp',
    'specId': 'F10',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': true,
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
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'focus',
          'disabled',
          'invalid',
        ],
      },
      'label': {
        'kind': 'text',
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
      'name': {
        'kind': 'text',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'slot',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
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
        'parts': [
          'slot',
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
        'parts': [
          'root',
          'slot',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native one-time-code input',
    'keyboard': [
      {
        'key': 'ArrowLeft/ArrowRight/Home/End',
        'action': 'Move the native input selection',
      },
      {
        'key': 'Backspace/Delete',
        'action': 'Edit the native code input',
      },
      {
        'key': 'Paste',
        'action': 'Replace the native selection with sanitized digits',
      },
    ],
    'tokenRoles': [
      'border/input',
      'destructive/default',
      'radius/input',
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Native controls own keyboard/form behavior. Transient focus/hover is CSS/native; data-state also supports deliberate preview. Client visual/controlled updates require an island.',
      'One real text input handles selection, autofill and form value; grouped slots are aria-hidden mirrors. content is slot anatomy, not a caller prop. Paste normalizes ASCII digits and preserves native selection replacement.',
    ],
  },
  {
    'name': 'slider',
    'specId': 'F11',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': true,
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
      'label': {
        'kind': 'text',
        'required': true,
      },
      'labels': {
        'kind': 'collection',
      },
      'name': {
        'kind': 'text',
      },
      'min': {
        'kind': 'number',
        'default': 0,
      },
      'max': {
        'kind': 'number',
        'default': 100,
      },
      'step': {
        'kind': 'number',
        'default': 1,
      },
      'values': {
        'kind': 'collection',
      },
      'defaultValues': {
        'kind': 'collection',
      },
      'onValuesChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'track',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'range',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'thumb',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value-label',
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
      'Native controls own keyboard/form behavior. Transient focus/hover is CSS/native; data-state also supports deliberate preview. Client visual/controlled updates require an island.',
      'value is the design value-label visibility boolean; numeric positions use values/defaultValues. One/two native range inputs keep shared min/max geometry and clamp crossing requests.',
      'Coincident upper-half thumbs put the lower native input on top; at the lower half the upper input stays on top, so pointer users can separate endpoint thumbs.',
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
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'closed',
          'checked',
          'unchecked',
        ],
        'parts': [
          'root',
          'input',
          'content',
          'item',
        ],
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
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
