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
      'code': {
        'kind': 'text',
        'description':
          'Raw clipboard source; absent text derives from display rows excluding removals.',
      },
      'filename': {
        'kind': 'text',
      },
      'lang': {
        'kind': 'text',
      },
      'tabs': {
        'kind': 'collection',
      },
      'lines': {
        'kind': 'collection',
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'single',
          'tabbed',
          'diff',
          'default',
          'destructive',
          'added',
          'removed',
          'highlighted',
        ],
        'description': 'Ledger modes plus published phase1 aliases.',
      },
      'tone': {
        'kind': 'enum',
        'values': [
          'default',
          'destructive',
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
        'kind': 'boolean',
        'values': ['none', 'title', 'tabs'],
        'default': true,
        'description':
          'Boolean chrome control with legacy none/title/tabs aliases; tabs without files falls back to title. Essential file tabs remain when chrome is hidden.',
      },
      'copy': {
        'kind': 'boolean',
        'default': true,
      },
      'lineNumbers': {
        'kind': 'boolean',
        'default': false,
      },
      'footer': {
        'kind': 'boolean',
        'default': false,
      },
      'footerContent': {
        'kind': 'slot',
      },
      'scrollbar': {
        'kind': 'boolean',
        'default': true,
      },
      'value': {
        'kind': 'text',
      },
      'defaultValue': {
        'kind': 'text',
      },
      'onValueChange': {
        'kind': 'callback',
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'copied',
        ],
      },
      'onCopied': {
        'kind': 'callback',
      },
      'onCopyError': {
        'kind': 'callback',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'head',
        'when': 'header enabled',
      },
      {
        'name': 'name',
        'when': 'filename supplied outside tabbed mode',
      },
      {
        'name': 'lang',
        'when': 'header and lang supplied',
      },
      {
        'name': 'tabs',
        'when': 'tabbed mode',
      },
      {
        'name': 'tab',
        'when': 'tabbed mode',
      },
      {
        'name': 'copy',
        'when': 'header and copy enabled',
      },
      {
        'name': 'content',
      },
      {
        'name': 'line',
      },
      {
        'name': 'line-number',
        'when': 'lineNumbers enabled',
      },
      {
        'name': 'sign',
      },
      {
        'name': 'code',
      },
      {
        'name': 'syntax',
        'when': 'caller supplies Token content',
      },
      {
        'name': 'marker',
        'representation': 'pseudo',
        'when': 'highlighted row',
      },
      {
        'name': 'scrollbar',
        'representation': 'native',
        'when': 'overflow and scrollbar enabled',
      },
      {
        'name': 'thumb',
        'representation': 'native',
        'when': 'overflow and scrollbar enabled',
      },
      {
        'name': 'copy-tooltip',
        'representation': 'native',
        'when': 'browser shows the copy button title',
      },
      {
        'name': 'footer',
        'when': 'footer enabled',
      },
      {
        'name': 'added-count',
        'when': 'diff header enabled',
      },
      {
        'name': 'removed-count',
        'when': 'diff header enabled',
      },
      {
        'name': 'status',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'native focus-visible',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'single',
          'tabbed',
          'diff',
        ],
        'compatibilityValues': [
          'default',
          'destructive',
          'added',
          'removed',
          'highlighted',
        ],
      },
      'data-tone': {
        'values': [
          'default',
          'destructive',
        ],
      },
      'data-size': {
        'values': [
          'md',
          'sm',
        ],
      },
      'data-header': {
        'values': [
          'none',
          'title',
          'tabs',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'copied',
        ],
        'parts': [
          'root',
        ],
      },
      'data-scrollbar': {
        'values': [
          'true',
          'false',
        ],
      },
      'data-line-variant': {
        'values': [
          'default',
          'added',
          'removed',
          'highlighted',
        ],
        'parts': [
          'line',
        ],
      },
      'data-syntax': {
        'values': [
          'keyword',
          'function',
          'type',
          'string',
          'number',
          'comment',
          'punctuation',
        ],
        'parts': [
          'syntax',
        ],
      },
    },
    'booleans': [
      'header',
      'copy',
      'lineNumbers',
      'footer',
      'scrollbar',
    ],
    'slots': [
      {
        'name': 'footerContent',
        'part': 'footer',
      },
      {
        'name': 'lines',
        'part': 'line',
      },
    ],
    'apg': 'Tabs APG with native buttons, code and horizontal overflow regions',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native tabs, copy control and code scroll region',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate the focused tab or copy button',
      },
      {
        'key': 'ArrowLeft/ArrowRight',
        'action':
          'Navigate horizontal file tabs, respecting direction; code scroll regions retain native arrows',
      },
      {
        'key': 'Home/End',
        'action': 'Select first/last file tab',
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
      'code/bg',
      'code/syntax/*',
      'scrollbar/thumb',
      'font/mono',
      'type/code/*',
    ],
    'notes': [
      'Ledger modes single/tabbed/diff and tone replace the old design-only vocabulary; published default/destructive/added/removed/highlighted aliases remain supported.',
      'Legacy header none/title/tabs aliases remain; header=tabs without files renders a title header. Header=false removes file chrome/copy but never removes essential tab controls.',
      'Native horizontal scrollbar/thumb and native copy title tooltip are platform internals, not fabricated layout parts.',
      'Syntax content is a trusted application slot; plain raw text is escaped, with no tokenizer or unsafe HTML.',
      'Syntax roles apply on code/bg. Tinted diff/highlight rows use text/fg until the token workstream certifies syntax pairs on those backgrounds.',
      'Clipboard result callbacks are separate from native onCopy. Actual status ignores stale file/text requests; controlled state may render a chosen visual snapshot.',
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
