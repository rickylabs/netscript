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
    name: 'data-table',
    specId: 'D5',
    category: 'Data display',
    priority: 'P0',
    shipped: true,
    props: {
      children: { kind: 'slot', description: 'DataTable frame and compound section content.' },
      interactive: {
        kind: 'boolean',
        default: false,
        description: 'DataTable frame hover/focus styling; adds no activation handler.',
      },
      state: {
        kind: 'enum',
        values: ['default', 'selection', 'empty', 'loading'],
        description:
          'DataTable defaults to default. DataGrid derives empty/selection/default when omitted; explicit loading/empty shows supplied content.',
      },
      columns: {
        kind: 'collection',
        description:
          'DataGrid columns; header accepts Renderable, headerLabel supplies mobile text, sort describes native aria-sort, width sets tracks and cell is strong or num.',
      },
      rows: {
        kind: 'collection',
        description:
          'DataGrid rows retain data/id/selected snapshots and mutually exclusive onSelect/href. Optional row label names its native activation.',
      },
      label: { kind: 'text', description: 'DataGrid native table accessible name.' },
      selectedIds: {
        kind: 'collection',
        description: 'Controlled row identities; stale IDs do not inflate the visible count.',
      },
      onSelectionChange: {
        kind: 'callback',
        description:
          'Receives a complete next selection set; refusal preserves physical checkbox checked/mixed properties.',
      },
      renderBulkActions: {
        kind: 'callback',
        description:
          'DataGrid callback receiving visible count, selectedIds and clearSelection; its returned content sits outside the table.',
      },
      renderRowActions: {
        kind: 'callback',
        description:
          'DataGrid callback receiving data and row/selected context; returned controls are independent of row activation.',
      },
      empty: {
        kind: 'slot',
        description:
          'DataGrid caller-owned empty content in one spanning native cell; absent content stays empty.',
      },
      loading: {
        kind: 'slot',
        description:
          'DataGrid caller-owned loading content in one spanning native cell; absent content stays empty with aria-busy.',
      },
      'Row.cols': {
        kind: 'text',
        description:
          'DataTable.Row native grid track value; preserves native string or object styles.',
      },
    },
    parts: [
      { name: 'root' },
      ...['header', 'body', 'row', 'footer'].map((name) => ({
        name,
        when: 'the corresponding DataTable section or DataGrid structure is supplied',
      })),
      ...['table', 'head', 'header-cell', 'cell'].map((name) => ({
        name,
        when: 'DataGrid is supplied',
      })),
      {
        name: 'bulk-actions',
        when:
          'visible selected rows and renderBulkActions are supplied outside empty/loading states',
      },
      { name: 'selection', when: 'DataGrid selection controls are enabled' },
      { name: 'actions', when: 'renderRowActions supplies a cell' },
      { name: 'row-action', when: 'a row has onSelect' },
      { name: 'row-link', when: 'a row has href' },
      { name: 'cell-strong', when: 'a column uses cell=strong' },
      { name: 'cell-num', when: 'a column uses cell=num' },
      { name: 'cell-label', when: 'a DataGrid cell supplies its noninteractive mobile label' },
      { name: 'empty', when: 'the empty state supplies its spanning content cell' },
      { name: 'loading', when: 'the loading state supplies its spanning content cell' },
    ],
    attributes: {
      'data-state': {
        values: ['default', 'selection', 'empty', 'loading'],
        compatibilityValues: ['rest', 'selected'],
        parts: ['root', 'row'],
        description:
          'Root presentation state; selected is the retained visual row snapshot. Native checkboxes own live selection semantics.',
      },
      'data-type': {
        values: ['header', 'button', 'link'],
        parts: ['row'],
        description: 'Header row or the kind of native row activation; plain rows omit it.',
      },
      'data-interactive': {
        values: ['true'],
        parts: ['root', 'row'],
        description: 'Present only for an interactive frame or native row action/link.',
      },
      'data-variant': {
        values: ['strong', 'num'],
        parts: ['cell'],
        description: 'Existing public DataGrid cell treatments; unstyled cells omit the axis.',
      },
    },
    booleans: ['interactive'],
    slots: [
      { name: 'children', part: 'root' },
      { name: 'Header.children', part: 'header' },
      { name: 'Body.children', part: 'body' },
      { name: 'Row.children', part: 'row' },
      { name: 'Footer.children', part: 'footer' },
      { name: 'empty', part: 'empty' },
      { name: 'loading', part: 'loading' },
    ],
    apg: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/',
    keyboard: [
      {
        key: 'Tab/Shift+Tab',
        action:
          'Visit independent native child controls in source order; static table cells and rows add no tab stop.',
      },
      {
        key: 'Enter',
        action:
          'Activate the focused native row link/button or caller-owned action; child activation never activates its row.',
      },
      {
        key: 'Space',
        action:
          'Activate the focused native button or checkbox; selection and action controls never trigger row activation.',
      },
    ],
    tokenRoles: [
      'space/card/padding',
      'space/inline/gap',
      'surface/card',
      'surface/hover',
      'surface/selected',
      'border/default',
      'text/fg',
      'text/muted',
      'border/ring',
    ],
    notes: [
      'DataTable is the copied composition frame; DataGrid is its package rows/columns presentation under the same canonical identity. A frame may intentionally contain an independently rendered DataGrid root.',
      'The audit replaces role=grid without grid navigation and whole-button/anchor role=row with a native table and independent native actions. Caller callback/data APIs are retained; there is no grid keyboard manager.',
      'Native DOM attributes pass through. DataTable owns its frame state without leaking Card size/variant axes; selected row snapshots keep data-state, while checkboxes own checked/mixed state.',
      'Header strings remain valid. The widened Renderable header port requires readers to narrow before string operations; headerLabel supplies plain mobile text without duplicating controls.',
      'Responsive mobile cards use native CSS and retain visible header controls, not a breakpoint prop or serialized data-breakpoint axis.',
      'Research-only row-actions/cell-link/cell-value/footer-action anatomy is replaced by the actual actions/row-link/row-action and cell content parts emitted by these public surfaces.',
      'Sorting, filtering, paging, row data and empty/loading content remain caller-owned. No engine or sample rows are synthesized.',
    ],
  },
  {
    'name': 'item',
    'specId': 'D6',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
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
      'chevron': {
        'kind': 'boolean',
      },
      'media': {
        'kind': 'slot',
      },
      'title': {
        'kind': 'slot',
        'required': true,
      },
      'children': { 'kind': 'slot' },
      'description': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'header': {
        'kind': 'slot',
      },
      'footer': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'media',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
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
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'header',
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
      {
        'name': 'chevron',
        'when': 'when chevron is true',
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
      'chevron',
    ],
    'slots': [
      {
        'name': 'media',
        'part': 'media',
      },
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
      {
        'name': 'header',
        'part': 'header',
      },
      {
        'name': 'footer',
        'part': 'footer',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native child controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate native child buttons; links use Enter',
      },
    ],
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
      'Native child controls retain their own semantics and keyboard behavior; no wrapper key manager.',
    ],
  },
];
