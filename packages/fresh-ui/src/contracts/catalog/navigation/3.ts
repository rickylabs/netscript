import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const navigation_3: readonly ComponentContract[] = [
  {
    'name': 'menubar',
    'specId': 'N7',
    'category': 'Navigation',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'label': {
        'kind': 'text',
        'required': true,
      },
      'menus': {
        'kind': 'collection',
        'required': true,
      },
      'value': {
        'kind': 'text',
      },
      'defaultValue': {
        'kind': 'text',
      },
      'onValueChange': {
        'kind': 'callback',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'trigger',
          'content',
        ],
        'compatibilityValues': [
          'closed',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    'keyboard': [
      {
        'key': 'ArrowLeft/ArrowRight',
        'action': 'Navigate menu triggers',
      },
      {
        'key': 'ArrowDown',
        'action': 'Open menu',
      },
      {
        'key': 'Escape',
        'action': 'Close menu',
      },
      {
        'key': 'Home/End',
        'action': 'Move to first/last enabled trigger or menu item.',
      },
      {
        'key': 'Enter/Space',
        'action': 'Open a menu, activate actions or change caller-owned checkbox/radio state.',
      },
      {
        'key': 'ArrowRight/ArrowLeft in submenu',
        'action': 'Open/close nested menu, respecting direction.',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Close the menu and leave through the roving trigger.',
      },
      {
        'key': 'Printable character',
        'action': 'Find the next matching menu item.',
      },
    ],
    'tokenRoles': [
      'border/default',
      'radius/input',
      'surface/bg',
      'surface/hover',
    ],
    'notes': [
      'Roving native application menu triggers delegate popovers and collection keys to public ActionMenu; source must hydrate in an island.',
      'Menu records contain app callbacks and controlled choice state. Nested menu items use private copied menu-items support, not a second public component identity.',
      'Trigger/content preserve runtime open/closed; disabled/hover/focus are native properties and CSS. value/null controls the open menu.',
    ],
  },
  {
    'name': 'location-marker',
    'specId': 'N8',
    'category': 'Navigation',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'deco/marker',
    ],
    'notes': [
      'Decorative aria-hidden square; parent owns aria-current. No focus stop. Existing Studio marker token with foreground fallback; no token changes.',
    ],
  },
  {
    'name': 'stepper',
    'specId': 'N9',
    'category': 'Navigation',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'description': {
        'kind': 'boolean',
      },
      'connector': {
        'kind': 'boolean',
      },
      'steps': {
        'kind': 'collection',
        'required': true,
        'description':
          'Unique IDs, titles, descriptions, status and optional native href. At most one current step.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
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
        'name': 'connector',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'step',
        'when': 'one per supplied step',
      },
    ],
    'attributes': {
      'data-status': {
        'values': [
          'complete',
          'current',
          'upcoming',
          'error',
        ],
        'parts': [
          'step',
        ],
      },
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
    },
    'booleans': [
      'description',
      'connector',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'primary/default',
      'primary/fg',
      'radius/badge',
      'text/muted',
      'topbar/rule',
    ],
    'notes': [
      'Ordered list presentation; status belongs to each step record. Native links are optional, no composite key manager. Current step owns aria-current=step and every status has readable text.',
    ],
  },
];
