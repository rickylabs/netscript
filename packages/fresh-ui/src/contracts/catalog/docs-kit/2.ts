import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_2: readonly ComponentContract[] = [
  {
    'name': 'file-path-chip',
    'specId': 'X2',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'copied',
        ],
      },
      'path': {
        'kind': 'slot',
      },
      'copy': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'path',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'copy',
        'planned': true,
      },
      {
        'name': 'focus-ring',
        'planned': true,
        'representation': 'pseudo',
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
      },
    },
    'booleans': [
      'copy',
    ],
    'slots': [
      {
        'name': 'path',
        'part': 'path',
      },
    ],
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
    ],
  },
  {
    'name': 'attribute-chip',
    'specId': 'X3',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
      },
      'name': {
        'kind': 'slot',
      },
      'value': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'name',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'value',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'name',
        'part': 'name',
      },
      {
        'name': 'value',
        'part': 'value',
      },
    ],
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
