import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_3: readonly ComponentContract[] = [
  {
    'name': 'file-tree',
    'specId': 'X5',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'items': {
        'kind': 'collection',
        'required': true,
        'description':
          'Readonly discriminated folder/file entries with stable unique nonblank IDs.',
      },
      'label': {
        'kind': 'text',
        'default': 'Project files',
      },
      'tag': {
        'kind': 'boolean',
        'default': true,
        'description': 'Controls visible annotations; hidden annotation text remains accessible.',
      },
      'typeLabels': {
        'kind': 'collection',
        'description': 'Optional localizable folder/file equivalents; blank uses defaults.',
      },
      'Entry.id': {
        'kind': 'text',
        'required': true,
      },
      'Entry.type': {
        'kind': 'enum',
        'values': [
          'folder',
          'file',
        ],
        'required': true,
      },
      'Entry.name': {
        'kind': 'slot',
        'required': true,
      },
      'Entry.comment': {
        'kind': 'slot',
      },
      'Entry.ownership': {
        'kind': 'enum',
        'values': [
          'none',
          'owned',
          'generated',
          'guidance',
        ],
        'default': 'none',
      },
      'Entry.tag': {
        'kind': 'text',
        'description': 'Full annotation text overriding default bracketed ownership.',
      },
      'Entry.children': {
        'kind': 'collection',
        'description': 'Folder-only readonly child entries; no collapse/selection state.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'list',
      },
      {
        'name': 'node',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'row',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'icon',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'name',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'comment',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'tag',
        'when': 'when corresponding entries or annotations are supplied',
      },
      {
        'name': 'type-label',
        'when': 'when corresponding entries or annotations are supplied',
      },
    ],
    'attributes': {
      'data-type': {
        'values': [
          'folder',
          'file',
        ],
        'parts': [
          'row',
        ],
      },
      'data-ownership': {
        'values': [
          'none',
          'owned',
          'generated',
          'guidance',
        ],
        'parts': [
          'row',
        ],
        'default': 'none',
      },
    },
    'booleans': [
      'tag',
    ],
    'slots': [
      {
        'name': 'Entry.name',
        'part': 'name',
      },
      {
        'name': 'Entry.comment',
        'part': 'comment',
      },
    ],
    'apg': 'native read-only nested lists and supplied native child controls',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Visit supplied native child controls; list frames add no tab stop',
      },
      {
        'key': 'Enter/Space',
        'action':
          'Retain supplied native child control behavior; no tree selection or collapse keys',
      },
    ],
    'tokenRoles': [
      'surface/bg',
      'border/subtle',
      'font/mono',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs wins: read-only list, not an ARIA tree; no chevrons/hover/selection/open state/indent guides. Rows26 high, indent20. Ownership tags support owned config, generated history and CLI-managed annotations.',
      'Every row retains a static folder/file type equivalent. Ownership annotations remain readable when visually hidden. Duplicate IDs, cycles and file children fail structural validation; no filesystem inspection.',
      'Native list/listitem roles preserve semantics under list-style:none. All nodes remain visible; names/comments may contain caller-owned native links.',
    ],
  },
  {
    'name': 'figure',
    'specId': 'X6',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'width': {
        'kind': 'enum',
        'values': [
          'prose',
          'wide',
        ],
        'default': 'prose',
      },
      'media': {
        'kind': 'enum',
        'values': [
          'image',
          'diagram',
        ],
        'default': 'image',
      },
      'children': {
        'kind': 'slot',
        'required': true,
      },
      'caption': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'media',
      },
      {
        'name': 'caption',
        'when': 'when caption is supplied',
      },
    ],
    'attributes': {
      'data-width': {
        'values': [
          'prose',
          'wide',
        ],
        'default': 'prose',
      },
      'data-media': {
        'values': [
          'image',
          'diagram',
        ],
        'default': 'image',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'media',
      },
      {
        'name': 'caption',
        'part': 'caption',
      },
    ],
    'apg': 'native figure, caller media and optional figcaption',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Visit supplied native media/link controls; figure adds no tab stop',
      },
      {
        'key': 'Enter/Space',
        'action': 'Retain supplied native child control behavior',
      },
    ],
    'tokenRoles': [
      'border/subtle',
      'surface/surface',
      'surface/bg',
      'text/muted',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'Caller supplies actual media and alternative text/diagram name; no placeholder or fetch. Native intrinsic aspect ratio is preserved.',
      'Widths reuse existing optional prose-measure/wide roles with100%fallback, matching Markdown; native figure attributes pass through.',
    ],
  },
  {
    'name': 'anchor-nav',
    'specId': 'X7',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'scrolled',
        ],
        'default': 'rest',
        'description':
          'Caller snapshot only with observe=false. Types forbid state with observe=true; measured geometry wins at runtime.',
      },
      'label': {
        'kind': 'text',
        'default': 'Sections',
      },
      'children': {
        'kind': 'slot',
        'required': true,
      },
      'currentId': {
        'kind': 'text',
        'description':
          'Controlled accepted section ID; explicit null means no current. Refusal never changes the marker.',
      },
      'defaultCurrentId': {
        'kind': 'text',
        'default': null,
        'description':
          'Initial uncontrolled ID; SSR never reads location. A valid initial hash proposes after hydration.',
      },
      'onCurrentChange': {
        'kind': 'callback',
        'description':
          'Distinct native hash or optional scroll proposals; reason hash|scroll. Never writes URL or moves focus.',
      },
      'observe': {
        'kind': 'boolean',
        'default': false,
        'description':
          'Optional passive section tracking in the caller-owned island; respects native scroll padding and heading scroll margins.',
      },
      'Link.href': {
        'kind': 'text',
        'required': true,
      },
      'Link.children': {
        'kind': 'slot',
        'required': true,
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'anchor',
        'when': 'when Link children are supplied',
      },
      {
        'name': 'marker',
        'when': 'when a Link is the accepted current',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'scrolled',
        ],
        'default': 'rest',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'anchor',
      },
      {
        'name': 'Link.children',
        'part': 'anchor',
      },
    ],
    'apg': 'native navigation links',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native section links',
      },
      {
        'key': 'Enter',
        'action': 'Follow the focused section link',
      },
    ],
    'tokenRoles': [
      'surface/bg',
      'topbar/rule',
      'text/fg',
      'marker/default',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs: scrolled changes current anchor and pinned position, without extra Utility shadow.',
      'Observed scrolled state requires a later accepted section and actual pinned geometry. Before hydration it is rest; non-observed snapshots default to rest.',
      'Native anchor/Tab/Enter navigation, never ARIA tabs. Root state is owned; link aria-current/scope/part are owned and illicit data-level/data-state are omitted. No observer writes URL or moves focus.',
    ],
  },
];
