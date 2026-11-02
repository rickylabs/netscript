import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const actions_2: readonly ComponentContract[] = [
  {
    'name': 'toggle',
    'specId': 'A4',
    'category': 'Actions',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'outline',
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
      'selected': {
        'kind': 'boolean',
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
      'iconStart': {
        'kind': 'boolean',
      },
      'iconEnd': {
        'kind': 'boolean',
      },
      'label': {
        'kind': 'boolean',
      },
      'defaultSelected': {
        'kind': 'boolean',
        'default': false,
      },
      'onSelectedChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'children': {
        'kind': 'slot',
      },
      'iconStartGlyph': {
        'kind': 'slot',
      },
      'iconEndGlyph': {
        'kind': 'slot',
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
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
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
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'outline',
        ],
      },
      'data-size': {
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'data-selected': {
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
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'iconStart',
      'iconEnd',
      'label',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'label',
      },
      {
        'name': 'iconStartGlyph',
        'part': 'icon-start',
      },
      {
        'name': 'iconEndGlyph',
        'part': 'icon-end',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle aria-pressed',
      },
    ],
    'tokenRoles': [
      'border/default',
      'radius/control',
      'surface/selected',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native CSS pseudo-classes carry transient focus/hover; data-state also supports deliberate preview renders. Native button semantics preserve form behavior.',
    ],
  },
  {
    'name': 'toggle-group',
    'specId': 'A5',
    'category': 'Actions',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'outline',
          'segmented',
        ],
      },
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
        ],
      },
      'type': {
        'kind': 'enum',
        'values': [
          'single',
          'multiple',
        ],
      },
      'label': {
        'kind': 'text',
        'required': true,
      },
      'items': {
        'kind': 'collection',
        'required': true,
      },
      'value': {
        'kind': 'collection',
      },
      'defaultValue': {
        'kind': 'collection',
      },
      'onValueChange': {
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
        'when': 'variant=segmented',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'outline',
          'segmented',
        ],
      },
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
        ],
      },
      'data-type': {
        'values': [
          'single',
          'multiple',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Move focus between toggles',
      },
      {
        'key': 'Home/End',
        'action': 'Focus first/last toggle',
      },
      {
        'key': 'Enter/Space',
        'action': 'Toggle focused item',
      },
    ],
    'tokenRoles': [
      'space/inline/gap',
    ],
    'notes': [
      'Native CSS pseudo-classes carry transient focus/hover; data-state also supports deliberate preview renders. Native button semantics preserve form behavior.',
    ],
  },
  {
    'name': 'action-bar',
    'specId': 'A6',
    'category': 'Actions',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'floating',
          'inline',
        ],
      },
      'close': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'count',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'close',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'floating',
          'inline',
        ],
      },
    },
    'booleans': [
      'close',
    ],
    'slots': [
      {
        'name': 'actions',
        'part': 'actions',
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
      'surface/inverse',
      'surface/selected',
      'text/inverse',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
