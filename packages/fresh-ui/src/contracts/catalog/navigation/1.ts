import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const navigation_1: readonly ComponentContract[] = [
  {
    'name': 'breadcrumb',
    'specId': 'N1',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'type': {
        'kind': 'enum',
        'values': [
          'link',
          'current',
          'ellipsis',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
        ],
      },
      'items': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'link',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'current',
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
      'data-type': {
        'values': [
          'link',
          'current',
          'ellipsis',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus links',
      },
      {
        'key': 'Enter',
        'action': 'Follow link',
      },
    ],
    'tokenRoles': [
      'text/fg',
      'text/muted',
      'type/strong/style',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'pagination',
    'specId': 'N2',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'numbered',
          'pager',
        ],
      },
      'type': {
        'kind': 'enum',
        'values': [
          'page',
          'previous',
          'next',
          'ellipsis',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'current',
          'disabled',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'meta',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'previous',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'next',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'direction',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'title',
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
          'numbered',
          'pager',
        ],
        'plannedValues': [
          'pager',
        ],
      },
      'data-type': {
        'values': [
          'page',
          'previous',
          'next',
          'ellipsis',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'current',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native navigation links',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus links',
      },
      {
        'key': 'Enter',
        'action': 'Follow link',
      },
    ],
    'tokenRoles': [
      'border/control',
      'border/subtle',
      'radius/control',
      'space/card/padding',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'tabs',
    'specId': 'N3',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'line',
        ],
      },
      'selected': {
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
          'hover',
          'focus',
          'disabled',
        ],
      },
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'count': {
        'kind': 'boolean',
      },
      'iconStart': {
        'kind': 'boolean',
      },
      'marker': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'list',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'marker',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'count',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'indicator',
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
          'line',
        ],
        'plannedValues': [
          'line',
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
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
    },
    'booleans': [
      'count',
      'iconStart',
      'marker',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    'keyboard': [
      {
        'key': 'ArrowLeft/ArrowRight',
        'action': 'Move between horizontal tabs',
      },
      {
        'key': 'ArrowUp/ArrowDown',
        'action': 'Move between vertical tabs',
      },
      {
        'key': 'Home/End',
        'action': 'Focus first/last tab',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused tab in manual mode',
      },
    ],
    'tokenRoles': [
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
