import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_3: readonly ComponentContract[] = [
  {
    'name': 'file-tree',
    'specId': 'X5',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'type': {
        'kind': 'enum',
        'values': [
          'folder',
          'file',
        ],
      },
      'ownership': {
        'kind': 'enum',
        'values': [
          'none',
          'owned',
          'generated',
          'guidance',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'name': {
        'kind': 'slot',
      },
      'tag': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'row',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'indent',
        'planned': true,
      },
      {
        'name': 'icon',
        'planned': true,
      },
      {
        'name': 'name',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'tag',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-type': {
        'values': [
          'folder',
          'file',
        ],
      },
      'data-ownership': {
        'values': [
          'none',
          'owned',
          'generated',
          'guidance',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'row',
      },
      {
        'name': 'name',
        'part': 'name',
      },
      {
        'name': 'tag',
        'part': 'tag',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
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
    ],
  },
  {
    'name': 'figure',
    'specId': 'X6',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'width': {
        'kind': 'enum',
        'values': [
          'prose',
          'wide',
        ],
      },
      'media': {
        'kind': 'enum',
        'values': [
          'image',
          'diagram',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'caption': {
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
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'caption',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-width': {
        'values': [
          'prose',
          'wide',
        ],
      },
      'data-media': {
        'values': [
          'image',
          'diagram',
        ],
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
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'surface/surface',
      'surface/bg',
      'text/muted',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
    ],
  },
  {
    'name': 'anchor-nav',
    'specId': 'X7',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'scrolled',
        ],
      },
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'anchor',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'marker',
        'planned': true,
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'scrolled',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
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
    ],
  },
];
