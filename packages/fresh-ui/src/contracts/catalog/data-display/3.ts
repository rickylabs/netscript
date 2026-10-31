import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_3: readonly ComponentContract[] = [
  {
    'name': 'kbd',
    'specId': 'D7',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'inverse',
        ],
      },
      'children': {
        'kind': 'slot',
        'required': true,
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
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
      'data-variant': {
        'values': [
          'default',
          'inverse',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native kbd notation; no keyboard interaction',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'font/mono',
      'radius/badge',
      'size/kbd',
      'surface/card',
      'text/inverse',
      'text/muted',
    ],
    'notes': [
      'Native kbd notation is noninteractive; Kbd.Group joins keys with decorative plus separators.',
    ],
  },
  {
    'name': 'code-block',
    'specId': 'D8',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'destructive',
          'added',
          'removed',
          'highlighted',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'md',
          'sm',
        ],
      },
      'header': {
        'kind': 'enum',
        'values': [
          'none',
          'title',
          'tabs',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'copied',
        ],
      },
      'code': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'filename': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'lang': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'copy': {
        'kind': 'boolean',
      },
      'lineNumbers': {
        'kind': 'boolean',
      },
      'footer': {
        'kind': 'boolean',
      },
      'scrollbar': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'head',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'name',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'lang',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'tabs',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'copy',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
      },
      {
        'name': 'line',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'line-number',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'code',
      },
      {
        'name': 'scrollbar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'thumb',
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
      'data-variant': {
        'values': [
          'default',
          'destructive',
          'added',
          'removed',
          'highlighted',
        ],
        'plannedValues': [
          'destructive',
          'added',
          'removed',
          'highlighted',
        ],
      },
      'data-size': {
        'values': [
          'md',
          'sm',
        ],
        'plannedValues': [
          'sm',
        ],
      },
      'data-header': {
        'values': [
          'none',
          'title',
          'tabs',
        ],
        'plannedValues': [
          'tabs',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'copied',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'copy',
      'lineNumbers',
      'footer',
      'scrollbar',
    ],
    'slots': [],
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
      'border/subtle',
      'destructive/border',
      'destructive/subtle',
      'destructive/text',
      'marker/default',
      'radius/card',
      'space/stack/gap',
      'success/subtle',
      'success/text',
      'surface/selected',
      'surface/surface',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'chart',
    'specId': 'D9',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'locale': {
        'kind': 'text',
        'default': 'en-US',
        'description': 'Explicit number locale shared by server and client.',
      },
      'type': {
        'kind': 'enum',
        'values': [
          'area',
          'line',
        ],
      },
      'series': {
        'kind': 'collection',
        'required': true,
        'description': 'One to three labeled series; data-series is derived from their count.',
      },
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'indicator': {
        'kind': 'enum',
        'values': [
          'dot',
          'line',
          'dashed',
        ],
      },
      'data': {
        'kind': 'collection',
        'required': true,
      },
      'title': {
        'kind': 'text',
        'required': true,
      },
      'description': {
        'kind': 'text',
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'loading',
          'empty',
        ],
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
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'plot',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'grid',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'axis-x',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'axis-y',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'series-1',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'series-2',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'series-3',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'cursor',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'legend',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'tooltip',
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
      {
        'name': 'skeleton',
        'when': 'loading',
      },
      {
        'name': 'empty',
        'when': 'empty',
      },
      {
        'name': 'data',
      },
      {
        'name': 'data-trigger',
      },
      {
        'name': 'table',
      },
      {
        'name': 'line',
        'when': 'plot present',
      },
      {
        'name': 'area',
        'when': 'type area and plot present',
      },
    ],
    'attributes': {
      'data-type': {
        'values': [
          'area',
          'line',
        ],
      },
      'data-series': {
        'values': [
          '1',
          '2',
          '3',
        ],
      },
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'data-indicator': {
        'values': [
          'dot',
          'line',
          'dashed',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'loading',
          'empty',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native figure and SVG image with labeled series plus native data disclosure/table',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Focus the native data disclosure; chart graphics add no focus targets',
      },
      {
        'key': 'Enter/Space',
        'action': 'Toggle the source data table',
      },
    ],
    'tokenRoles': [
      'SF:deco/sparkline',
      'SF:deco/ticks',
      'border/subtle',
      'chart/1..5',
      'destructive/default',
      'info/default',
      'primary/default',
      'success/default',
      'text/muted',
      'warning/default',
    ],
    'notes': [
      'Exact data values remain available through a native disclosure/table; hover is supplemental, never the only data access.',
      'Series count derives from1–3 labeled input series. Each datum has a label and matching finite numeric values. Legend orientation does not rotate the Cartesian plot.',
      'Existing chart/1..3 roles follow the latest per-theme chart palette ledger. No token values change.',
    ],
  },
];
