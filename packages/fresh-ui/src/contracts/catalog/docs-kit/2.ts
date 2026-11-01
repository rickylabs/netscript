import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_2: readonly ComponentContract[] = [
  {
    'name': 'file-path-chip',
    'specId': 'X2',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'path': {
        'kind': 'text',
        'required': true,
        'description': 'Exact original clipboard text, rendered escaped; never a JSX slot.',
      },
      'copy': {
        'kind': 'boolean',
        'default': true,
      },
      'copyLabel': {
        'kind': 'text',
        'default': 'Copy path',
      },
      'copiedLabel': {
        'kind': 'text',
        'default': 'Path copied',
      },
      'errorLabel': {
        'kind': 'text',
        'default': 'Could not copy path',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'path',
      },
      {
        'name': 'status',
      },
      {
        'name': 'copy',
        'when': 'when copy is true',
      },
      {
        'name': 'focus-ring',
        'when': 'when the native copy button is keyboard focused',
        'representation': 'native',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'copied',
        ],
        'default': 'rest',
        'description':
          'Derived actual rest/copied outcome; hover/focus use native CSS. Error feedback is visible status text, never a fake Copied variant.',
      },
    },
    'booleans': [
      'copy',
    ],
    'slots': [],
    'apg': 'native button',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Copy the path from the focused copy button',
      },
    ],
    'tokenRoles': [
      'surface/surface',
      'border/subtle',
      'radius/badge',
      'radius/control',
      'font/mono',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs follows live padding2/5, height26, 20px copy target and size/icon/sm glyph.',
      'Copy description references exact path. Clipboard failures are visible and announced; stale/out-of-order/path-changed/unmounted completions cannot update current UI. No clipboard polyfill or automatic timer.',
      'copy=false removes the native button. Native span attributes pass through; writable state is not a prop.',
    ],
  },
  {
    'name': 'attribute-chip',
    'specId': 'X3',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'name': {
        'kind': 'text',
        'required': true,
      },
      'value': {
        'kind': 'text',
        'required': true,
        'description': 'Escaped String(value) in quotes; accepts string, number, boolean or null.',
      },
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
        'default': 'md',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'name',
      },
      {
        'name': 'value',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
        'default': 'md',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'surface/surface',
      'radius/badge',
      'font/mono',
      'text/muted',
      'text/fg',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs: no border, following live docs CSS.',
      'Native escaped textual code example only, not a DOM attribute editor; zero/false/empty are preserved. Native span attributes pass through.',
    ],
  },
  {
    'name': 'toc',
    'specId': 'X4',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
        'description':
          'Forced view or responsive island measurement. Unforced server-only output stays desktop.',
      },
      'label': {
        'kind': 'text',
        'default': 'On this page',
      },
      'children': {
        'kind': 'slot',
        'required': true,
      },
      'links': {
        'kind': 'slot',
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
      'Item.href': {
        'kind': 'text',
        'required': true,
      },
      'Item.children': {
        'kind': 'slot',
        'required': true,
      },
      'Item.level': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
        ],
        'default': '2',
      },
      'Item.state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
        ],
        'default': 'rest',
        'description':
          'Forced preview only; accepted root selection derives current and wins. Live hover is native CSS.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'eyebrow',
      },
      {
        'name': 'rail',
      },
      {
        'name': 'item',
        'when': 'when Item children are supplied',
      },
      {
        'name': 'links',
        'when': 'when footer links are supplied',
      },
      {
        'name': 'current',
        'when': 'in the mobile native disclosure summary',
      },
      {
        'name': 'marker',
        'when': 'when a link is the accepted current or its text is shown in the mobile summary',
      },
      {
        'name': 'chevron-down',
        'when': 'in the mobile summary',
      },
    ],
    'attributes': {
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
        'default': 'desktop',
      },
      'data-level': {
        'values': [
          '2',
          '3',
        ],
        'parts': [
          'item',
        ],
        'default': '2',
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'current',
        ],
        'parts': [
          'item',
        ],
        'default': 'rest',
        'description':
          'Derived current overrides forced rest/hover preview; actual live hover/focus stays CSS.',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'rail',
      },
      {
        'name': 'links',
        'part': 'links',
      },
      {
        'name': 'Item.children',
        'part': 'item',
      },
    ],
    'apg': 'native navigation links and disclosure',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between section links and the mobile disclosure',
      },
      {
        'key': 'Enter',
        'action': 'Follow the focused section link',
      },
      {
        'key': 'Enter/Space',
        'action': 'Toggle the mobile disclosure',
      },
    ],
    'tokenRoles': [
      'text/muted',
      'text/fg',
      'border/subtle',
      'surface/bg',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs mobile starts closed; open is native disclosure state, not a variant. Toc item13/20.',
      'Unshipped placeholder root level/state normalized to Item.level/Item.state; all settled data values and native keys remain. Current is root-owned, never an Item input.',
      'One native responsive branch; automatic island measurement uses767px, unforced SSR remains desktop. Forced mobile native details starts closed and its open state persists across current updates.',
      'Native pass-through is preserved; scope/part/level/state/aria-current are owned. Hash/scroll proposals are deduplicated and controlled refusal preserves accepted state. No tab roles, scroll commands or live region.',
    ],
  },
];
