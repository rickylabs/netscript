import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const layout_blocks_4: readonly ComponentContract[] = [
  {
    'name': 'scroll-area',
    'specId': 'L9',
    'category': 'Layout & blocks',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'vertical',
          'horizontal',
          'both',
        ],
        'default': 'vertical',
      },
      'children': {
        'kind': 'slot',
      },
      'label': {
        'kind': 'text',
        'required': true,
        'description': 'Accessible name of the native viewport',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'viewport',
      },
      {
        'name': 'scrollbar',
        'representation': 'native',
      },
      {
        'name': 'thumb',
        'representation': 'native',
      },
      {
        'name': 'corner',
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
        'default': 'vertical',
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
      'The viewport is always tabbable for stable server rendering; scrollbar geometry and hover sizing follow native platform limits.',
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
    'shipped': true,
    'props': {
      'ratio': {
        'kind': 'enum',
        'values': [
          '16:9',
          '4:3',
          '1:1',
          '21:9',
        ],
        'default': '16:9',
      },
      'children': {
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
    ],
    'attributes': {
      'data-ratio': {
        'values': [
          '16:9',
          '4:3',
          '1:1',
          '21:9',
        ],
        'default': '16:9',
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
    'shipped': true,
    'props': {
      'as': {
        'kind': 'enum',
        'values': [
          'div',
          'section',
          'main',
          'article',
          'aside',
          'nav',
          'header',
          'footer',
          'form',
          'span',
        ],
      },
      'boundaryRef': {
        'kind': 'callback',
        'description': 'Native boundary ref; accepts a Preact ref callback or ref object',
      },
      'dir': {
        'kind': 'enum',
        'values': [
          'ltr',
          'rtl',
        ],
        'default': 'ltr',
      },
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'element',
      },
    ],
    'attributes': {
      'data-dir': {
        'values': [
          'ltr',
          'rtl',
        ],
        'default': 'ltr',
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
      'DirectionProvider aliases Direction: as renders the caller-selected native boundary with native props/boundaryRef, supporting precompiled JSX; otherwise clone one unscoped native HTML VNode preserving key/ref and existing props. Direction owns dir/markers. Reject unsupported as tags, scoped boundary props and invalid clone children. No extra wrapper or global mutation.',
    ],
  },
];
