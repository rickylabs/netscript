import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const docs_kit_4: readonly ComponentContract[] = [
  {
    'name': 'ruled-grid',
    'specId': 'X8',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'columns': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
          '4',
        ],
        'default': '3',
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'ruled',
          'feature',
        ],
        'default': 'ruled',
      },
      'children': {
        'kind': 'slot',
      },
      'Cell.eyebrow': {
        'kind': 'slot',
      },
      'Cell.icon': {
        'kind': 'slot',
      },
      'Cell.title': {
        'kind': 'slot',
      },
      'Cell.children': {
        'kind': 'slot',
      },
      'Cell.action': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'grid',
      },
      {
        'name': 'cell',
        'when': 'when Cell is supplied',
      },
      {
        'name': 'card',
        'when': 'when Cell is supplied',
      },
      {
        'name': 'eyebrow',
        'when': 'when Cell.eyebrow is supplied',
      },
      {
        'name': 'icon',
        'when': 'when Cell.icon is supplied',
      },
      {
        'name': 'title',
        'when': 'when Cell.title is supplied',
      },
      {
        'name': 'description',
        'when': 'when Cell.children is supplied',
      },
      {
        'name': 'action',
        'when': 'when Cell.action is supplied',
      },
      {
        'name': 'arrow',
        'when': 'when Cell is supplied; decorative only',
      },
    ],
    'attributes': {
      'data-columns': {
        'values': [
          '2',
          '3',
          '4',
        ],
        'default': '3',
        'parts': [
          'root',
        ],
      },
      'data-variant': {
        'values': [
          'ruled',
          'feature',
        ],
        'default': 'ruled',
        'parts': [
          'root',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'cell',
      },
      {
        'name': 'Cell.eyebrow',
        'part': 'eyebrow',
      },
      {
        'name': 'Cell.icon',
        'part': 'icon',
      },
      {
        'name': 'Cell.title',
        'part': 'title',
      },
      {
        'name': 'Cell.children',
        'part': 'description',
      },
      {
        'name': 'Cell.action',
        'part': 'action',
      },
    ],
    'apg': 'native caller-owned controls in noninteractive Docs card frames',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Visit supplied native controls; card and grid frames add no tab stop',
      },
      {
        'key': 'Enter/Space',
        'action': 'Retain supplied native child control behavior',
      },
    ],
    'tokenRoles': [
      'border/subtle',
      'topbar/rule',
      'space/section/gap',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-desktop-docs uses private Docs card anatomy, not D3 Card; feature gap32 follows live CSS.',
      'Explicit normalization of unshipped X8: qualified Cell slots and private Docs-card parts; never imports D3 Card. No Cell axes or whole-card click handler.',
      'Container widths <=767 use1column;767<width<=1100 use2;above1100 use requested columns. Complementary ranges cover fractional widths; logical inline-end/bottom rules are single edges.',
    ],
  },
  {
    'name': 'hero',
    'specId': 'X9',
    'category': 'Docs kit',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'layout': {
        'kind': 'enum',
        'values': [
          'split',
          'centered',
        ],
        'default': 'split',
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
        'description':
          'Optional forced desktop/mobile reference; absent means CSS container responsiveness, no data-breakpoint attribute.',
      },
      'eyebrow': {
        'kind': 'slot',
      },
      'title': {
        'kind': 'slot',
        'required': true,
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
      'headingLevel': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
        ],
        'default': '1',
        'description': 'Native heading rank only; typography follows responsive presentation.',
      },
      'paths': {
        'kind': 'slot',
        'description': 'Caller-owned file-path chips follow content inside the aside.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'layout',
      },
      {
        'name': 'display',
      },
      {
        'name': 'eyebrow',
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'title',
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'lede',
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'actions',
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'aside',
        'when': 'when aside or paths is supplied',
      },
      {
        'name': 'path-stack',
        'when': 'when paths is supplied',
      },
    ],
    'attributes': {
      'data-layout': {
        'values': [
          'split',
          'centered',
        ],
        'default': 'split',
        'parts': [
          'root',
        ],
      },
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
        'parts': [
          'root',
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
      {
        'name': 'paths',
        'part': 'path-stack',
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
      'Explicit normalization of unshipped X9: string headingLevel1..6, optional paths slot and necessary container-query layout part. Forced data-breakpoint is absent in automatic mode.',
      'CSS container width<=767 stacks with title role;767<width<=1100 uses fluid1.5:1/gap40;above1100 uses17:9/gap80 capped1120. Forced snapshots bypass automatic queries. No duplicated DOM, hooks or L2 imports.',
    ],
  },
];
