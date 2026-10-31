import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const layout_blocks_2: readonly ComponentContract[] = [
  {
    'name': 'detail-layout',
    'specId': 'L4',
    'category': 'Layout & blocks',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'aside': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'main',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'aside',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
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
        'name': 'children',
        'part': 'main',
      },
      {
        'name': 'aside',
        'part': 'aside',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'space/section/gap',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'filter-form',
    'specId': 'L5',
    'category': 'Layout & blocks',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'layout': {
        'kind': 'enum',
        'values': [
          'inline',
          'stacked',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-layout': {
        'values': [
          'inline',
          'stacked',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native buttons and links',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused button; links use Enter',
      },
    ],
    'tokenRoles': [
      'space/stack/gap',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'panel',
    'specId': 'L6',
    'category': 'Layout & blocks',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'muted',
          'raised',
        ],
      },
      'children': {
        'kind': 'slot',
      },
      'tone': {
        'kind': 'enum',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'footer': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'header',
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
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'muted',
          'raised',
        ],
      },
    },
    'booleans': [
      'footer',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'body',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'radius/card',
      'space/stack/gap',
      'surface/card',
      'surface/muted',
      'surface/raised',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'variant is canonical; tone remains a compatibility prop.',
    ],
  },
];
