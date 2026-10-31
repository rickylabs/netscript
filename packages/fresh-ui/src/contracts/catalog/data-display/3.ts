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
    'shipped': false,
    'props': {
      'type': {
        'kind': 'enum',
        'values': [
          'area',
          'line',
        ],
      },
      'series': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
          '3',
        ],
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
    },
    'parts': [
      {
        'name': 'root',
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
        'name': 'plot',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'grid',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'axis-x',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'axis-y',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'series-1',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'series-2',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'series-3',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'cursor',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'legend',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'tooltip',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'swatch',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'value',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
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
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
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
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
