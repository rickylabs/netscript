import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const layout_blocks_4: readonly ComponentContract[] = [
  {
    'name': 'scroll-area',
    'specId': 'L9',
    'category': 'Layout & blocks',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'vertical',
          'horizontal',
          'both',
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
        'name': 'viewport',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'scrollbar',
        'planned': true,
        'representation': 'native',
      },
      {
        'name': 'thumb',
        'planned': true,
        'representation': 'native',
      },
      {
        'name': 'corner',
        'planned': true,
        'representation': 'native',
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'vertical',
          'horizontal',
          'both',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'viewport',
      },
    ],
    'apg': 'native scrollable region',
    'keyboard': [
      {
        'key': 'Arrow keys/PageUp/PageDown/Home/End',
        'action': 'Scroll the focused native viewport',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'border/default',
      'radius/card',
      'space/card/padding',
      'studio/code/scroll-thumb',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-layout adds a bordered radius/card frame; scrollbar anatomy is native and must not require fake scrollbar elements.',
    ],
  },
  {
    'name': 'resizable',
    'specId': 'L10',
    'category': 'Layout & blocks',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'direction': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'startContent': {
        'kind': 'slot',
      },
      'endContent': {
        'kind': 'slot',
      },
      'grip': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'panel-group',
        'planned': true,
      },
      {
        'name': 'panel',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'handle',
        'planned': true,
      },
      {
        'name': 'grip',
        'planned': true,
      },
    ],
    'attributes': {
      'data-direction': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
    },
    'booleans': [
      'grip',
    ],
    'slots': [
      {
        'name': 'startContent',
        'part': 'panel',
      },
      {
        'name': 'endContent',
        'part': 'panel',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Resize the adjacent panel in the matching direction',
      },
      {
        'key': 'Home/End',
        'action': 'Resize to the minimum/maximum',
      },
    ],
    'tokenRoles': [
      'border/default',
      'border/strong',
      'surface/muted',
      'radius/badge',
      'space/card/padding',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-layout: 10px grip glyph; fixed default start panel size 280 horizontal or 160 vertical instead of 50/50.',
    ],
  },
  {
    'name': 'aspect-ratio',
    'specId': 'L11',
    'category': 'Layout & blocks',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'ratio': {
        'kind': 'enum',
        'values': [
          '16:9',
          '4:3',
          '1:1',
          '21:9',
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
        'name': 'media',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-ratio': {
        'values': [
          '16:9',
          '4:3',
          '1:1',
          '21:9',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'media',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'radius/card',
      'surface/muted',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
    ],
  },
  {
    'name': 'direction',
    'specId': 'L12',
    'category': 'Layout & blocks',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'dir': {
        'kind': 'enum',
        'values': [
          'ltr',
          'rtl',
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
        'representation': 'context',
      },
    ],
    'attributes': {
      'data-dir': {
        'values': [
          'ltr',
          'rtl',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'root',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'surface/bg',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'No Figma set: direction context has no additional visual wrapper; native dir on the application boundary supplies mirroring.',
    ],
  },
];
