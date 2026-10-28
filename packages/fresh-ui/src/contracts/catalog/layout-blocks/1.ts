import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const layout_blocks_1: readonly ComponentContract[] = [
  {
    'name': 'app-shell',
    'specId': 'L1',
    'category': 'Layout & blocks',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'layout': {
        'kind': 'enum',
        'values': [
          'dashboard',
          'chat',
          'docs',
        ],
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'tablet',
          'mobile',
        ],
      },
      'nav': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'rail': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
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
        'name': 'sidebar',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'context',
      },
      {
        'name': 'main',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'topbar',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'context',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'session',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'thread',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'composer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'sidebar-backdrop',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-layout': {
        'values': [
          'dashboard',
          'chat',
          'docs',
        ],
      },
      'data-breakpoint': {
        'values': [
          'desktop',
          'tablet',
          'mobile',
        ],
      },
      'data-nav': {
        'values': [
          'false',
          'true',
        ],
      },
      'data-rail': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [
      'nav',
      'rail',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'content',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'space/page/padding-x|y',
      'space/section/gap',
      'surface/bg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'page-header',
    'specId': 'L2',
    'category': 'Layout & blocks',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'with-tabs',
          'with-status',
        ],
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'eyebrow': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'boolean',
      },
      'breadcrumb': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'layout',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'main',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'intro',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'eyebrow',
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
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'status-bar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'status-indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'status-sep',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'tabs',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'aside',
        'when': 'corresponding shipped Utility section is supplied',
      },
      {
        'name': 'badges',
        'when': 'corresponding shipped Utility section is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'with-tabs',
          'with-status',
        ],
      },
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
      },
    },
    'booleans': [
      'eyebrow',
      'description',
      'actions',
      'breadcrumb',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'space/section/gap',
      'space/stack/gap',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Utility structural helper parts remain distinct from the single component root.',
    ],
  },
  {
    'name': 'stats-grid',
    'specId': 'L3',
    'category': 'Layout & blocks',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'hero',
        ],
      },
      'delta': {
        'kind': 'enum',
        'values': [
          'up',
          'down',
          'none',
        ],
      },
      'columns': {
        'kind': 'enum',
        'values': [
          '2',
          '3',
          '4',
        ],
      },
      'joined': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'label': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'value': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'detail': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'badge': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'icon': {
        'kind': 'boolean',
      },
      'sparkline': {
        'kind': 'boolean',
      },
      'ticks': {
        'kind': 'boolean',
      },
      'blockbars': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'card',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'badge',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'detail',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'sparkline',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'ticks',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'blockbars',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'hero',
        ],
      },
      'data-delta': {
        'values': [
          'up',
          'down',
          'none',
        ],
      },
      'data-columns': {
        'values': [
          '2',
          '3',
          '4',
        ],
      },
      'data-joined': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [
      'badge',
      'icon',
      'detail',
      'sparkline',
      'ticks',
      'blockbars',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'destructive/text',
      'primary/default',
      'primary/fg',
      'radius/card',
      'space/card/padding',
      'success/text',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
