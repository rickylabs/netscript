import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_2: readonly ComponentContract[] = [
  {
    'name': 'drawer',
    'specId': 'O4',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'side': {
        'kind': 'enum',
        'values': [
          'bottom',
          'right',
          'left',
          'top',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'open',
        ],
      },
      'body': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'backdrop',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'header',
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
        'name': 'close',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'handle',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-side': {
        'values': [
          'bottom',
          'right',
          'left',
          'top',
        ],
        'plannedValues': [
          'top',
          'left',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'closed',
        ],
        'parts': [
          'trigger',
          'content',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'body',
        'part': 'body',
      },
    ],
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
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
      'Utility Drawer composes the native Dialog runtime; its scope is dialog. Side positioning is consumer CSS, not a new phase-one behavior.',
    ],
  },
  {
    'name': 'popover',
    'specId': 'O5',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'placement': {
        'kind': 'enum',
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'open',
        ],
      },
      'arrow': {
        'kind': 'boolean',
      },
      'title': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'close': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'anchor',
        'when': 'explicit anchor supplied',
      },
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'positioner',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
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
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'close',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'arrow',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'arrow-tip',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-placement': {
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'closed',
        ],
        'parts': [
          'trigger',
          'positioner',
          'content',
          'anchor',
          'title',
          'description',
          'close',
          'arrow',
          'arrow-tip',
        ],
      },
    },
    'booleans': [
      'arrow',
      'title',
      'description',
      'close',
    ],
    'slots': [],
    'apg': 'native nonmodal popover',
    'keyboard': [
      {
        'key': 'Escape',
        'action': 'Dismiss; restore popover trigger focus or keep tooltip trigger focus',
      },
    ],
    'tokenRoles': [
      'border/default',
      'space/stack/gap',
      'surface/raised',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'tooltip',
    'specId': 'O6',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'placement': {
        'kind': 'enum',
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'open',
        ],
      },
      'arrow': {
        'kind': 'boolean',
      },
      'kbd': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'positioner',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'kbd',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'arrow',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'arrow-tip',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-placement': {
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'closed',
        ],
        'parts': [
          'trigger',
          'positioner',
          'content',
          'arrow',
          'arrow-tip',
        ],
      },
    },
    'booleans': [
      'arrow',
      'kbd',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    'keyboard': [
      {
        'key': 'Escape',
        'action': 'Dismiss; restore popover trigger focus or keep tooltip trigger focus',
      },
    ],
    'tokenRoles': [
      'radius/badge',
      'space/badge/padding-x',
      'surface/inverse',
      'text/inverse',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
