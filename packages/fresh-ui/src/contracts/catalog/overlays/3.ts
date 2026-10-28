import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_3: readonly ComponentContract[] = [
  {
    'name': 'hover-card',
    'specId': 'O7',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'placement': {
        'kind': 'enum',
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'open',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'content',
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
        'name': 'meta',
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
      'data-placement': {
        'values': [
          'top',
          'right',
          'bottom',
          'left',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
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
      'text/muted',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
  {
    'name': 'dropdown-menu',
    'specId': 'O8',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'type': {
        'kind': 'enum',
        'values': [
          'action',
          'checkbox',
          'radio',
          'submenu',
          'option',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'highlighted',
          'disabled',
          'open',
        ],
      },
      'intent': {
        'kind': 'enum',
        'values': [
          'default',
          'destructive',
        ],
      },
      'iconStart': {
        'kind': 'boolean',
      },
      'shortcut': {
        'kind': 'boolean',
      },
      'inset': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'loading': {
        'kind': 'boolean',
      },
      'checked': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'representation': 'context',
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
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'indicator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'shortcut',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'group-label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-text',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
      'data-type': {
        'values': [
          'action',
          'checkbox',
          'radio',
          'submenu',
          'option',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'highlighted',
          'disabled',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'closed',
        ],
        'parts': [
          'trigger',
          'content',
          'item',
        ],
      },
      'data-intent': {
        'values': [
          'default',
          'destructive',
        ],
      },
    },
    'booleans': [
      'iconStart',
      'shortcut',
      'inset',
      'description',
      'loading',
      'checked',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    'keyboard': [
      {
        'key': 'Enter/Space/ArrowDown',
        'action': 'Open and focus menu',
      },
      {
        'key': 'ArrowUp/ArrowDown',
        'action': 'Navigate items',
      },
      {
        'key': 'Home/End',
        'action': 'First/last enabled item',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss and restore trigger focus',
      },
      {
        'key': 'Printable keys',
        'action': 'Typeahead',
      },
    ],
    'tokenRoles': [
      'border/subtle',
      'destructive/subtle',
      'destructive/text',
      'radius/input',
      'surface/hover',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Dropdown menu is the contract name; ActionMenu is the compatible runtime API.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'context-menu',
    'specId': 'O9',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': false,
    'props': {
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
        'name': 'trigger',
        'when': 'when the corresponding content or subcomponent is supplied',
        'planned': true,
      },
      {
        'name': 'content',
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
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    'keyboard': [
      {
        'key': 'ArrowUp/ArrowDown',
        'action': 'Navigate items',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused item',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss menu',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Design contract only; no Utility implementation ships in this phase.',
    ],
  },
];
