import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const actions_1: readonly ComponentContract[] = [
  {
    'name': 'button',
    'specId': 'A1',
    'category': 'Actions',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'primary',
          'secondary',
          'outline',
          'ghost',
          'destructive',
          'link',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
          'icon',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'pressed',
          'focus',
          'disabled',
          'loading',
        ],
      },
      'type': {
        'kind': 'enum',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
        'values': [
          'button',
          'submit',
          'reset',
          'link',
        ],
      },
      'href': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'icon': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'iconPosition': {
        'kind': 'enum',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
        'values': [
          'left',
          'right',
        ],
      },
      'clientNav': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'loading': {
        'kind': 'boolean',
      },
      'iconStart': {
        'kind': 'boolean',
      },
      'iconEnd': {
        'kind': 'boolean',
      },
      'iconStartGlyph': {
        'kind': 'slot',
      },
      'iconEndGlyph': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
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
        'name': 'icon-start',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'spinner',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
      },
      {
        'name': 'icon-end',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'state-layer',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'underline',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'primary',
          'secondary',
          'outline',
          'ghost',
          'destructive',
          'link',
        ],
        'plannedValues': [
          'link',
        ],
      },
      'data-size': {
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
          'icon',
        ],
        'plannedValues': [
          'xs',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'pressed',
          'focus',
          'disabled',
          'loading',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'loading',
      'iconStart',
      'iconEnd',
    ],
    'slots': [
      {
        'name': 'iconStartGlyph',
        'part': 'icon-start',
      },
      {
        'name': 'iconEndGlyph',
        'part': 'icon-end',
      },
      {
        'name': 'children',
        'part': 'label',
      },
    ],
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
      'border/width',
      'destructive/default',
      'destructive/fg',
      'destructive/hover',
      'primary/default',
      'primary/fg',
      'primary/hover',
      'radius/control',
      'secondary/border',
      'secondary/default',
      'secondary/fg',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'icon-button',
    'specId': 'A2',
    'category': 'Actions',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'primary',
          'secondary',
          'outline',
          'ghost',
          'destructive',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'pressed',
          'focus',
          'disabled',
          'loading',
        ],
      },
      'icon': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'loading': {
        'kind': 'boolean',
      },
      'glyph': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'glyph',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'spinner',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'state-layer',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
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
          'primary',
          'secondary',
          'outline',
          'ghost',
          'destructive',
        ],
      },
      'data-size': {
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
        ],
        'plannedValues': [
          'xs',
          'sm',
          'lg',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'pressed',
          'focus',
          'disabled',
          'loading',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'loading',
    ],
    'slots': [
      {
        'name': 'glyph',
        'part': 'glyph',
      },
    ],
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
      'border/width',
      'destructive/default',
      'destructive/fg',
      'destructive/hover',
      'primary/default',
      'primary/fg',
      'primary/hover',
      'radius/control',
      'secondary/border',
      'secondary/default',
      'secondary/fg',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'button-group',
    'specId': 'A3',
    'category': 'Actions',
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
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'separator': {
        'kind': 'boolean',
      },
      'text': {
        'kind': 'boolean',
      },
      'children': {
        'kind': 'slot',
        'required': true,
      },
      'textContent': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'text',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'data-size': {
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
    },
    'booleans': [
      'separator',
      'text',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'root',
      },
      {
        'name': 'textContent',
        'part': 'text',
      },
    ],
    'apg': 'native buttons and links',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused button; links use Enter',
      },
    ],
    'tokenRoles': [
      'radius/control',
      'surface/muted',
      'text/muted',
    ],
    'notes': [
      'Native CSS pseudo-classes carry transient focus/hover; data-state also supports deliberate preview renders. Native button semantics preserve form behavior.',
    ],
  },
];
