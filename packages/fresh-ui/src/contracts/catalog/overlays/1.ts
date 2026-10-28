import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_1: readonly ComponentContract[] = [
  {
    'name': 'dialog',
    'specId': 'O1',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'scrim': {
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
          'open',
        ],
      },
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'description': {
        'kind': 'boolean',
      },
      'close': {
        'kind': 'boolean',
      },
      'footer': {
        'kind': 'boolean',
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
          'lg',
        ],
      },
      'data-scrim': {
        'values': [
          'false',
          'true',
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
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [
      'description',
      'close',
      'footer',
    ],
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
      'border/default',
      'border/width',
      'radius/card',
      'space/card/padding',
      'space/inline/gap',
      'space/stack/gap',
      'surface/card',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'alert-dialog',
    'specId': 'O2',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'destructive',
        ],
      },
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
          'open',
        ],
      },
      'media': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
        'planned': true,
      },
      {
        'name': 'backdrop',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'header',
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
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'media',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'cancel',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'action',
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
      'data-variant': {
        'values': [
          'default',
          'destructive',
        ],
      },
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'media',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Cycle focus within modal',
      },
      {
        'key': 'Escape',
        'action': 'Cancel and restore trigger focus',
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
    'name': 'sheet',
    'specId': 'O3',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'side': {
        'kind': 'enum',
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'scrim': {
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
          'open',
        ],
      },
      'footer': {
        'kind': 'boolean',
      },
      'close': {
        'kind': 'boolean',
      },
      'handle': {
        'kind': 'boolean',
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
          'top',
          'right',
          'bottom',
          'left',
        ],
        'plannedValues': [
          'top',
          'left',
        ],
      },
      'data-scrim': {
        'values': [
          'false',
          'true',
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
    'booleans': [
      'footer',
      'close',
      'handle',
    ],
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
      'border/default',
      'border/strong',
      'radius/card',
      'space/card/padding',
      'surface/card',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
