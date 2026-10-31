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
    'shipped': false,
    'props': {
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'level': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'current',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'links': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'eyebrow',
        'planned': true,
      },
      {
        'name': 'rail',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'item',
        'planned': true,
      },
      {
        'name': 'links',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'current',
        'planned': true,
      },
      {
        'name': 'marker',
        'planned': true,
      },
      {
        'name': 'chevron-down',
        'planned': true,
      },
    ],
    'attributes': {
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'data-level': {
        'values': [
          '2',
          '3',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'current',
        ],
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
    ],
  },
];
