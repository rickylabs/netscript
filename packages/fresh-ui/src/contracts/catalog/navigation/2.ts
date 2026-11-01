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
      'variant': {
        'kind': 'enum',
        'values': [
          'sidebar',
          'floating',
          'inset',
        ],
      },
      'collapsible': {
        'kind': 'enum',
        'values': [
          'expanded',
          'icon',
          'offcanvas',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
        ],
      },
      'level': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
      },
      'collapsed': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'icon': {
        'kind': 'boolean',
      },
      'count': {
        'kind': 'boolean',
      },
      'chevron': {
        'kind': 'boolean',
      },
      'marker': {
        'kind': 'boolean',
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
        'plannedValues': [
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
        'plannedValues': [
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
      },
      'data-level': {
        'values': [
          '1',
          '2',
        ],
      },
      'data-collapsed': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [
      'icon',
      'count',
      'chevron',
      'marker',
      'collapsible',
    ],
    'slots': [],
    'apg': 'native navigation links',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus links',
      },
      {
        'key': 'Enter',
        'action': 'Follow link',
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
    ],
  },
  {
    'name': 'top-bar',
    'specId': 'N5',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'app',
          'docs',
        ],
      },
      'breakpoint': {
        'kind': 'enum',
        'values': [
          'desktop',
          'mobile',
        ],
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
      },
      {
        'name': 'wordmark',
        'when': 'when the corresponding content or subcomponent is supplied',
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
      'effect/shadow',
      'space/inline/gap',
      'space/page/padding-x',
      'space/topbar/height',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'navigation-menu',
    'specId': 'N6',
    'category': 'Navigation',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'trigger': {
        'kind': 'enum',
        'values': [
          'link',
          'menu',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'open',
        ],
      },
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'list',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'marker',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'viewport',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'link',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
        'planned': true,
      },
    ],
    'attributes': {
      'data-trigger': {
        'values': [
          'link',
          'menu',
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
    ],
    'tokenRoles': [
      'radius/control',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
