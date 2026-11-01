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
    name: 'stats-grid',
    specId: 'L3',
    category: 'Layout & blocks',
    priority: 'P0',
    shipped: true,
    props: {
      children: { kind: 'slot', required: true, description: 'StatsGrid root content.' },
      columns: {
        kind: 'enum',
        values: ['2', '3', '4'],
        description:
          'Optional maximum column count, typed as 2 | 3 | 4. Unset retains container-adaptive auto-fit.',
      },
      joined: {
        kind: 'boolean',
        default: false,
        description: 'Root joined strip; cards retain one-pixel dividers when wrapping.',
      },
      variant: {
        kind: 'enum',
        values: ['default', 'hero'],
        default: 'default',
        description: 'StatsGrid.Card surface.',
      },
      delta: {
        kind: 'enum',
        values: ['up', 'down', 'none'],
        default: 'none',
        description:
          'StatsGrid.Card decorative direction arrow; the caller conveys its meaning in detail text.',
      },
      label: { kind: 'slot', required: true, description: 'StatsGrid.Card metric label.' },
      value: { kind: 'slot', required: true, description: 'StatsGrid.Card metric value.' },
      detail: {
        kind: 'slot',
        description: 'Optional StatsGrid.Card supporting content, including a signed change.',
      },
      badge: {
        kind: 'slot',
        description:
          'Optional StatsGrid.Card header badge; native child controls retain their behavior.',
      },
      icon: {
        kind: 'slot',
        description:
          'Optional StatsGrid.Card decorative icon, inert and hidden from assistive technology.',
      },
      sparkline: {
        kind: 'slot',
        description:
          'Optional caller-owned decorative content, empty by default and visible only when its theme role enables it.',
      },
      ticks: {
        kind: 'slot',
        description:
          'Optional caller-owned decorative content, empty by default and visible only when its theme role enables it.',
      },
      blockbars: {
        kind: 'slot',
        description:
          'Optional caller-owned decorative content, empty by default and visible only when its theme role enables it.',
      },
    },
    parts: [
      { name: 'root' },
      ...['card', 'header', 'body', 'label', 'value'].map((name) => ({
        name,
        when: 'StatsGrid.Card is supplied',
      })),
      ...['badge', 'detail', 'icon', 'sparkline', 'ticks', 'blockbars'].map((name) => ({
        name,
        when: 'the corresponding StatsGrid.Card slot is supplied',
      })),
      { name: 'delta', when: 'detail is supplied and delta is up or down' },
    ],
    attributes: {
      'data-columns': {
        values: ['2', '3', '4'],
        description: 'Only emitted when an explicit column cap is supplied.',
      },
      'data-joined': { values: ['false', 'true'], default: 'false' },
      'data-variant': { values: ['default', 'hero'], default: 'default', parts: ['card'] },
      'data-delta': { values: ['up', 'down', 'none'], default: 'none', parts: ['card'] },
    },
    booleans: ['joined'],
    slots: [
      { name: 'children', part: 'root' },
      ...['label', 'value', 'detail', 'badge', 'icon', 'sparkline', 'ticks', 'blockbars'].map((
        name,
      ) => ({ name, part: name })),
    ],
    apg: 'noninteractive presentation with native child controls',
    keyboard: [{
      key: 'Tab/Shift+Tab',
      action:
        'Move through caller-owned native controls in source order; the grid and cards add no tab stops.',
    }],
    tokenRoles: [
      'kpi/bg-1..4',
      'kpi/border',
      'kpi/border-top',
      'kpi/border-right',
      'kpi/border-bottom',
      'kpi/border-left',
      'kpi/first-left',
      'kpi/gap',
      'kpi/pad-x',
      'radius/card',
      'space/card/padding',
      'text/fg',
      'text/muted',
      'primary/default',
      'primary/fg',
      'success/text',
      'destructive/text',
      'deco/sparkline',
      'deco/ticks',
      'deco/blockbars',
    ],
    notes: [
      'Native DOM attributes pass through; owned contract markers take precedence.',
      'Root columns/joined and Card variant/delta are independent axes. The default grid remains container-adaptive rather than viewport-driven.',
      'Figma visibility booleans map to optional Renderable slots; empty slots render no part. Decorations are inert, aria-hidden and hidden without layout space when disabled by the theme.',
      'The card retains ns-card styling compatibility but owns its native element; Card-owned state and size axes do not leak into this scope.',
      'The category ledger wins: joined strips have an outer top/right/bottom rule, per-card left dividers and zero card radius.',
      'Series, tone and deltaTone promotions belong to the owner-approved phase after the Utility canary.',
    ],
  },
];
