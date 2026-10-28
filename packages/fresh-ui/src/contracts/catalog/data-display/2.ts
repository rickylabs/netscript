import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_2: readonly ComponentContract[] = [
  {
    'name': 'table',
    'specId': 'D4',
    'category': 'Data display',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'align': {
        'kind': 'enum',
        'values': [
          'start',
          'center',
          'end',
        ],
      },
      'sort': {
        'kind': 'enum',
        'values': [
          'none',
          'asc',
          'desc',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'text',
          'strong',
          'num',
          'data',
          'muted',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'selected',
          'focus',
        ],
      },
      'zebra': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'layout': {
        'kind': 'enum',
        'values': [
          'row',
          'stacked',
        ],
      },
      'columns': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'rows': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'getRowKey': {
        'kind': 'callback',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'caption': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'summary': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'emptyState': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'scroller',
      },
      {
        'name': 'table',
      },
      {
        'name': 'caption',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'head',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
      },
      {
        'name': 'row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'cell',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'cell-value',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'summary',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'empty',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'selection-bar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-align': {
        'values': [
          'start',
          'center',
          'end',
        ],
      },
      'data-sort': {
        'values': [
          'none',
          'asc',
          'desc',
        ],
      },
      'data-variant': {
        'values': [
          'text',
          'strong',
          'num',
          'data',
          'muted',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'selected',
          'focus',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
      'data-zebra': {
        'values': [
          'false',
          'true',
        ],
      },
      'data-layout': {
        'values': [
          'row',
          'stacked',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native table',
    'keyboard': [],
    'tokenRoles': [
      'marker/default',
      'space/table/cell-padding-x',
      'space/table/row-height',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'data-table',
    'specId': 'D5',
    'category': 'Data display',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'default',
          'selection',
          'empty',
          'loading',
        ],
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'columns': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'rows': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'selectedIds': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'onSelectionChange': {
        'kind': 'callback',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'renderBulkActions': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'renderRowActions': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'bulk-actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'table',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'cell',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'head',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'selection',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'header-cell',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'row-action',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'row-actions',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'cell-link',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'cell-value',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
      {
        'name': 'footer-action',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'default',
          'selection',
          'empty',
          'loading',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'rest',
          'selected',
        ],
        'parts': [
          'root',
          'row',
        ],
      },
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native rows and action controls',
    'keyboard': [],
    'tokenRoles': [
      'space/card/padding',
      'space/inline/gap',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'DataTable has compound slots; DataGrid is its rows/columns-driven package presentation. Native row links/buttons retain Tab/Enter/Space behavior, without an ARIA grid navigation claim.',
      'Utility compatibility anatomy is included for existing shipped helpers; it does not implement a design gap.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'item',
    'specId': 'D6',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'outline',
          'muted',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'default',
          'sm',
          'xs',
        ],
      },
      'description': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'boolean',
      },
      'header': {
        'kind': 'boolean',
      },
      'footer': {
        'kind': 'boolean',
      },
      'chevron': {
        'kind': 'boolean',
      },
      'media': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'media',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'content',
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
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'footer',
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
          'outline',
          'muted',
        ],
      },
      'data-size': {
        'values': [
          'default',
          'sm',
          'xs',
        ],
      },
    },
    'booleans': [
      'description',
      'actions',
      'header',
      'footer',
      'chevron',
    ],
    'slots': [
      {
        'name': 'media',
        'part': 'media',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'radius/badge',
      'radius/input',
      'space/card/padding',
      'space/stack/gap',
      'surface/muted',
      'text/muted',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
