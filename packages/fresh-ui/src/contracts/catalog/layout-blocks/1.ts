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
        'default': 'dashboard',
      },
      'sidebar': {
        'kind': 'enum',
        'values': [
          'expanded',
          'collapsed',
          'none',
        ],
        'default': 'expanded',
      },
      'nav': {
        'kind': 'boolean',
        'default': true,
      },
      'rail': {
        'kind': 'boolean',
        'default': false,
      },
      'sidebarVariant': {
        'kind': 'enum',
        'values': [
          'sidebar',
          'floating',
          'inset',
        ],
        'default': 'sidebar',
      },
      'pathname': {
        'kind': 'text',
        'required': true,
      },
      'navigation': {
        'kind': 'collection',
        'required': true,
      },
      'brand': {
        'kind': 'slot',
        'required': true,
      },
      'brandBadge': {
        'kind': 'slot',
      },
      'footer': {
        'kind': 'slot',
      },
      'topbarStart': {
        'kind': 'slot',
      },
      'topbarEnd': {
        'kind': 'slot',
      },
      'topbarBrand': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
        'required': true,
      },
      'railContent': {
        'kind': 'slot',
      },
      'mobileRailContent': {
        'kind': 'slot',
      },
      'session': {
        'kind': 'slot',
      },
      'thread': {
        'kind': 'slot',
        'description': 'Replaces children in the chat thread when supplied.',
      },
      'composer': {
        'kind': 'slot',
      },
      'sidebarOpen': {
        'kind': 'boolean',
      },
      'defaultSidebarOpen': {
        'kind': 'boolean',
        'default': false,
      },
      'onSidebarOpenChange': {
        'kind': 'callback',
      },
      'contentId': {
        'kind': 'text',
        'default': 'main-content',
      },
      'navLabel': {
        'kind': 'text',
        'default': 'Sidebar navigation',
      },
      'class': {
        'kind': 'text',
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
        'when': 'Native modal ::backdrop on the composed Dialog content.',
        'representation': 'pseudo',
      },
      {
        'name': 'sidebar-disclosure',
        'when': 'Corresponding optional content or native disclosure is present.',
      },
      {
        'name': 'sidebar-summary',
        'when': 'Corresponding optional content or native disclosure is present.',
      },
      {
        'name': 'rail',
        'when': 'Corresponding optional content or native disclosure is present.',
      },
      {
        'name': 'mobile-rail',
        'when': 'Corresponding optional content or native disclosure is present.',
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
        'description':
          'Measured after hydration; absent during SSR. Native media queries govern the static fallback.',
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
      'data-sidebar-presentation': {
        'values': [
          'expanded',
          'collapsed',
          'none',
        ],
        'default': 'expanded',
      },
      'data-sidebar-mode': {
        'values': [
          'static',
          'hydrated',
        ],
        'default': 'static',
      },
    },
    'booleans': [
      'nav',
      'rail',
      'sidebarOpen',
      'defaultSidebarOpen',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'content',
      },
      {
        'name': 'brand',
        'part': 'sidebar',
      },
      {
        'name': 'brandBadge',
        'part': 'sidebar',
      },
      {
        'name': 'footer',
        'part': 'sidebar',
      },
      {
        'name': 'topbarStart',
        'part': 'topbar',
      },
      {
        'name': 'topbarEnd',
        'part': 'topbar',
      },
      {
        'name': 'topbarBrand',
        'part': 'topbar',
      },
      {
        'name': 'railContent',
        'part': 'rail',
      },
      {
        'name': 'mobileRailContent',
        'part': 'mobile-rail',
      },
      {
        'name': 'session',
        'part': 'session',
      },
      {
        'name': 'thread',
        'part': 'thread',
      },
      {
        'name': 'composer',
        'part': 'composer',
      },
    ],
    'apg': 'native layout with progressive details navigation and composed native modal Dialog',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Follow native links/controls; hydrated mobile modal contains focus.',
      },
      {
        'key': 'Enter/Space',
        'action':
          'Toggle the static native summary, a navigation group summary, or a sidebar button.',
      },
      {
        'key': 'Escape',
        'action':
          'Use composed native Dialog dismissal; cancelable proposals honor refusal and platform-forced close wins.',
      },
    ],
    'tokenRoles': [
      'space/page/padding-x|y',
      'space/section/gap',
      'surface/bg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Audited baseline: breakpoint is derived, not a prop. SidebarShell is the single app-shell/sidebar/top-bar family. nav=false aliases sidebar=none; topbar derives docs/app.',
      'Static SSR contains one initially open native details navigation in normal flow; whole-shell hydration selects one aside or mobile Dialog. Mobile expanded fallback may shift layout on hydration. sidebarOpen ports apply only to hydrated mobile navigation.',
      'Server-only Shell plus independently hydrated SidebarToggle is supported; whole-shell islands require serializable props/JSX slots. Navigation isActive functions and callback ports must be defined inside the same island.',
      'Chat children supply the thread unless thread is supplied; host owns messages, composer and business effects. Desktop rail is280px; mobileRailContent is its explicit mobile path.',
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
