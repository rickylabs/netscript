import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_4: readonly ComponentContract[] = [
  {
    'name': 'ruled-grid',
    'specId': 'X8',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'columns': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
          '4',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'ruled',
          'feature',
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
        'name': 'cell',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-columns': {
        'values': [
          '2',
          '3',
          '4',
        ],
      },
      'data-variant': {
        'values': [
          'ruled',
          'feature',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'cell',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'topbar/rule',
      'space/section/gap',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs uses private Docs card anatomy, not D3 Card; feature gap32 follows live CSS.',
    ],
  },
  {
    'name': 'hero',
    'specId': 'X9',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': false,
    'props': {
      'layout': {
        'kind': 'enum',
        'values': [
          'split',
          'centered',
        ],
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'eyebrow': {
        'kind': 'slot',
      },
      'title': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'aside': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'display',
        'planned': true,
      },
      {
        'name': 'eyebrow',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'title',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'lede',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'actions',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'aside',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'path-stack',
        'planned': true,
      },
    ],
    'attributes': {
      'data-layout': {
        'values': [
          'split',
          'centered',
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
    'slots': [
      {
        'name': 'eyebrow',
        'part': 'eyebrow',
      },
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'children',
        'part': 'lede',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
      {
        'name': 'aside',
        'part': 'aside',
      },
    ],
    'apg': 'native action controls in a section',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between supplied action controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate the focused action',
      },
    ],
    'tokenRoles': [
      'hero/bg',
      'hero/pad',
      'text/fg',
      'text/muted',
      'font/heading',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs places File path chips in aside path-stack, not display. Mobile uses existing title role; centered stacks aside below display.',
    ],
  },
];
