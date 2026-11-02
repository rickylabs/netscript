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
        'default': 'default',
      },
      'title': {
        'kind': 'slot',
      },
      'eyebrow': {
        'kind': 'slot',
      },
      'description': {
        'kind': 'slot',
      },
      'breadcrumb': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'tabs': {
        'kind': 'slot',
      },
      'status': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
      'class': {
        'kind': 'text',
      },
      'Layout.children': {
        'kind': 'slot',
        'required': true,
      },
      'Main.children': {
        'kind': 'slot',
        'required': true,
      },
      'Aside.children': {
        'kind': 'slot',
        'required': true,
      },
      'Badges.children': {
        'kind': 'slot',
        'required': true,
      },
      'Intro.children': {
        'kind': 'slot',
        'required': true,
      },
      'Actions.children': {
        'kind': 'slot',
        'required': true,
      },
      'Status.children': {
        'kind': 'slot',
        'required': true,
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'layout',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'main',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'intro',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'eyebrow',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'title',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'description',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'breadcrumb',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'actions',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'status-bar',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'tabs',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'aside',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
      {
        'name': 'badges',
        'when': 'Corresponding declarative content or composed section is supplied.',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'with-tabs',
          'with-status',
        ],
        'default': 'default',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'eyebrow',
        'part': 'eyebrow',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'breadcrumb',
        'part': 'breadcrumb',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
      {
        'name': 'tabs',
        'part': 'tabs',
      },
      {
        'name': 'status',
        'part': 'status-bar',
      },
      {
        'name': 'children',
        'part': 'root',
      },
      {
        'name': 'Layout.children',
        'part': 'layout',
      },
      {
        'name': 'Main.children',
        'part': 'main',
      },
      {
        'name': 'Aside.children',
        'part': 'aside',
      },
      {
        'name': 'Badges.children',
        'part': 'badges',
      },
      {
        'name': 'Intro.children',
        'part': 'intro',
      },
      {
        'name': 'Actions.children',
        'part': 'actions',
      },
      {
        'name': 'Status.children',
        'part': 'status-bar',
      },
    ],
    'apg': 'noninteractive presentation; native heading and child-owned controls',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Only native child controls receive focus in source order.',
      },
    ],
    'tokenRoles': [
      'space/section/gap',
      'space/stack/gap',
      'text/fg',
      'text/muted',
      'type/title',
      'type/eyebrow',
      'type/body',
    ],
    'notes': [
      'Native DOM attributes pass through; title is the native h1 content rather than a root tooltip attribute.',
      'Phase-one metadata correction: Figma boolean content switches are optional Renderable slots; breakpoint is responsive CSS, not an accepted prop or emitted attribute.',
      'The old namespace and children composition remain supported. Variants never synthesize tabs or status content; supplied slots render in any variant.',
      'Status indicators and separators are child-owned content, not fabricated PageHeader parts.',
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
