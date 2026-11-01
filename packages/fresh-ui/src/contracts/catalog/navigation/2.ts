import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const navigation_2: readonly ComponentContract[] = [
  {
    'name': 'sidebar',
    'specId': 'N4',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'sidebarVariant': {
        'kind': 'enum',
        'values': [
          'sidebar',
          'floating',
          'inset',
        ],
        'default': 'sidebar',
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
      'navigation': {
        'kind': 'collection',
        'required': true,
      },
      'navigation[].collapsible': {
        'kind': 'boolean',
        'default': false,
      },
      'navigation[].defaultOpen': {
        'kind': 'boolean',
        'default': true,
      },
      'navigation[].label': {
        'kind': 'text',
        'description': 'Required nonblank for collapsible native sections.',
      },
      'navigation[].items[].href': {
        'kind': 'text',
        'required': true,
      },
      'navigation[].items[].label': {
        'kind': 'text',
        'required': true,
      },
      'navigation[].items[].icon': {
        'kind': 'slot',
      },
      'navigation[].items[].count': {
        'kind': 'slot',
      },
      'navigation[].items[].level': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
        'default': '1',
      },
      'navigation[].items[].disabled': {
        'kind': 'boolean',
        'default': false,
      },
      'navigation[].items[].marker': {
        'kind': 'boolean',
        'default': true,
      },
      'navigation[].items[].chevron': {
        'kind': 'boolean',
        'default': false,
      },
      'navigation[].items[].matchPrefix': {
        'kind': 'boolean',
        'default': false,
      },
      'navigation[].items[].isActive': {
        'kind': 'callback',
      },
      'brand': {
        'kind': 'slot',
      },
      'brandBadge': {
        'kind': 'slot',
      },
      'footer': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'sidebar-header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'brand-group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'sidebar-body',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-group-label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-divider',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'sidebar-footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'marker',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'count',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'sidebar',
          'floating',
          'inset',
        ],
      },
      'data-collapsible': {
        'values': [
          'expanded',
          'icon',
          'offcanvas',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'nav-item',
        ],
      },
      'data-level': {
        'values': [
          '1',
          '2',
        ],
        'parts': [
          'nav-item',
        ],
      },
      'data-collapsed': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'nav-item',
        ],
      },
    },
    'booleans': [
      'navigation[].collapsible',
      'navigation[].defaultOpen',
      'navigation[].items[].disabled',
      'navigation[].items[].marker',
      'navigation[].items[].chevron',
      'navigation[].items[].matchPrefix',
    ],
    'slots': [
      {
        'name': 'brand',
        'part': 'brand-group',
      },
      {
        'name': 'brandBadge',
        'part': 'sidebar-header',
      },
      {
        'name': 'footer',
        'part': 'sidebar-footer',
      },
      {
        'name': 'navigation[].items[].icon',
        'part': 'nav-icon',
      },
      {
        'name': 'navigation[].items[].count',
        'part': 'count',
      },
    ],
    'apg': 'native navigation links and native details disclosures',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus links',
      },
      {
        'key': 'Enter',
        'action': 'Follow link',
      },
      {
        'key': 'Enter/Space',
        'action': 'Toggle a native collapsible section summary.',
      },
    ],
    'tokenRoles': [
      'border/subtle',
      'deco/marker',
      'radius/card',
      'space/section/gap',
      'space/stack/gap',
      'surface/bg',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Audited baseline: research-only flat state/level/count/etc props are actual SidebarShell navigation records; variant maps to sidebarVariant. Native hover/focus are CSS, while rest/selected/disabled are derived. Root collapsible derives expanded/icon/offcanvas from desktop presentation and measured mobile geometry.',
      'Native ul/li/a destinations retain aria-current; disabled items omit href, collapsed items retain accessible labels. Groups use native details/summary, independent of the outer static shell disclosure.',
    ],
  },
  {
    'name': 'top-bar',
    'specId': 'N5',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'topbarStart': {
        'kind': 'slot',
      },
      'topbarEnd': {
        'kind': 'slot',
      },
      'topbarBrand': {
        'kind': 'slot',
      },
      'layout': {
        'kind': 'enum',
        'values': [
          'dashboard',
          'chat',
          'docs',
        ],
        'default': 'dashboard',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'topbar-start',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'brand',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'logo',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'context',
      },
      {
        'name': 'wordmark',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'context',
      },
      {
        'name': 'topbar-end',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'app',
          'docs',
        ],
      },
      'data-breakpoint': {
        'values': [
          'desktop',
          'mobile',
        ],
        'description':
          'Measured after hydration; absent on SSR, tablet and mobile both use mobile topbar geometry.',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'topbarStart',
        'part': 'topbar-start',
      },
      {
        'name': 'topbarEnd',
        'part': 'topbar-end',
      },
      {
        'name': 'topbarBrand',
        'part': 'brand',
      },
    ],
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
      'effect/shadow',
      'space/inline/gap',
      'space/page/padding-x',
      'space/topbar/height',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Audited baseline: SidebarShell owns this topbar. variant app/docs and breakpoint are derived, not independent accepted props. Host owns logo/wordmark within topbarBrand. No future post-canary navigation promotion is included.',
    ],
  },
  {
    'name': 'navigation-menu',
    'specId': 'N6',
    'category': 'Navigation',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'label': {
        'kind': 'text',
        'required': true,
      },
      'items': {
        'kind': 'collection',
        'required': true,
        'description':
          'Unique IDs, labels and either href or a list of navigation links; current marks the active lane.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'list',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'marker',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'viewport',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'link',
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
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-trigger': {
        'values': [
          'link',
          'menu',
        ],
        'parts': [
          'item',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'item',
        ],
      },
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle disclosure',
      },
      {
        'key': 'Escape',
        'action': 'Close disclosure and return focus to its summary.',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Follow native link/summary order; focus exit closes disclosure.',
      },
    ],
    'tokenRoles': [
      'radius/control',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native details/name exclusivity works before hydration; island adds Escape and focus-exit dismissal. Open/trigger/state are derived from the native disclosure and item records.',
      'Current links, including disclosure-panel links, own aria-current=page; their decorative marker has no tab stop. Escape is handled only while a disclosure is open, preserving outer native dismissal.',
    ],
  },
];
