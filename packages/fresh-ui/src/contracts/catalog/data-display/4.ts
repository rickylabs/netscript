import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_4: readonly ComponentContract[] = [
  {
    'name': 'chart-block',
    'specId': 'D10',
    'category': 'Data display',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'bar',
          'column',
        ],
      },
      'tone': {
        'kind': 'enum',
        'values': [
          'primary',
          'success',
          'warning',
          'destructive',
          'secondary',
        ],
      },
      'data': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'title': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'sub': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'unit': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'sub',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'track',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'bar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'plot',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'yaxis',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'ytick',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'grid',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'col',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'val',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'xaxis',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'bar',
          'column',
        ],
      },
      'data-tone': {
        'values': [
          'primary',
          'success',
          'warning',
          'destructive',
          'secondary',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'material/track',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'donut',
    'specId': 'D11',
    'category': 'Data display',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'segments': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
          '4',
          '5',
        ],
      },
      'tone': {
        'kind': 'enum',
        'values': [
          'primary',
          'success',
          'warning',
          'destructive',
          'secondary',
        ],
      },
      'data': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'total': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'svg',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'ring',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'center',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'legend',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'swatch',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-segments': {
        'values': [
          '2',
          '3',
          '4',
          '5',
        ],
      },
      'data-tone': {
        'values': [
          'primary',
          'success',
          'warning',
          'destructive',
          'secondary',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'material/track',
      'radius/badge',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'accordion',
    'specId': 'D12',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'open': {
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
          'vertical',
          'horizontal',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
      },
      {
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-open': {
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
          'vertical',
          'horizontal',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle focused item',
      },
    ],
    'tokenRoles': [
      'space/stack/gap',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
