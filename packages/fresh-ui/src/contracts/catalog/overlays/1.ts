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
      'Cancelable Escape proposes closure and controlled parents may refuse. Non-cancelable platform close stands and reports native-close; accept false to keep closed, otherwise a subsequent accepted open=true render reopens the native modal.',
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'alert-dialog',
    'specId': 'O2',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
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
      'media': {
        'kind': 'boolean',
      },
      'open': {
        'kind': 'boolean',
      },
      'defaultOpen': {
        'kind': 'boolean',
      },
      'onOpenChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'triggerLabel': {
        'kind': 'text',
        'required': true,
      },
      'actionLabel': {
        'kind': 'text',
        'required': true,
      },
      'cancelLabel': {
        'kind': 'text',
        'required': false,
      },
      'title': {
        'kind': 'slot',
        'required': true,
      },
      'description': {
        'kind': 'slot',
        'required': true,
      },
      'children': {
        'kind': 'slot',
        'required': false,
      },
      'mediaIcon': {
        'kind': 'slot',
        'required': false,
      },
      'onAction': {
        'kind': 'callback',
      },
      'onCancel': {
        'kind': 'callback',
      },
      'pending': {
        'kind': 'boolean',
      },
    },
    'parts': [
      { 'name': 'label' },
      { 'name': 'spinner', 'when': 'pending action' },
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'backdrop',
        'when': 'native modal is open',
        'representation': 'pseudo',
      },
      {
        'name': 'content',
      },
      {
        'name': 'header',
      },
      {
        'name': 'title',
      },
      {
        'name': 'description',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
      },
      {
        'name': 'media',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'cancel',
      },
      {
        'name': 'action',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'trigger',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'destructive',
        ],
        'parts': [
          'content',
        ],
      },
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
        'parts': [
          'content',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'trigger',
          'content',
        ],
        'compatibilityValues': [
          'closed',
        ],
      },
    },
    'booleans': [
      'media',
    ],
    'slots': [
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'children',
        'part': 'body',
      },
      {
        'name': 'mediaIcon',
        'part': 'media',
      },
    ],
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
      'Context-only Root composes public native Dialog. Native backdrop requires no extra DOM; no close icon or outside-click dismissal.',
      'Cancel receives initial focus. Native Escape requests cancel; pending disables only the action. App callbacks and asynchronous work remain caller-owned.',
      'Action includes Button label/spinner parts. Canonical destructive fill/foreground roles are preserved; the scoped hover uses destructive/hover rather than the generic legacy raw red ramp. Token values remain owned by #2450.',
      'Open/closed runtime hooks remain on trigger/content; browser-forced dismissal remains native behavior.',
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
      'Cancelable Escape proposes closure and controlled parents may refuse. Non-cancelable platform close stands and reports native-close; accept false to keep closed, otherwise a subsequent accepted open=true render reopens the native modal.',
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
