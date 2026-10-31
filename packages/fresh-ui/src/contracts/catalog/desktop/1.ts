import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const desktop_1: readonly ComponentContract[] = [
  {
    'name': 'window-chrome',
    'specId': 'K1',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'platform': {
        'kind': 'enum',
        'values': [
          'macos',
          'windows',
          'linux',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'focused',
          'blurred',
          'disabled',
        ],
      },
      'title': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'actions': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'onAction': {
        'kind': 'callback',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'leading',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'identity',
      },
      {
        'name': 'title',
      },
      {
        'name': 'actions',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-platform': {
        'values': [
          'macos',
          'windows',
          'linux',
        ],
      },
      'data-state': {
        'values': [
          'focused',
          'blurred',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'active',
          'enabled',
        ],
        'parts': [
          'root',
          'action',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'destructive/default',
      'destructive/fg',
      'surface/surface',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'tray-menu',
    'specId': 'K2',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'type': {
        'kind': 'enum',
        'values': [
          'action',
          'role',
          'submenu',
          'separator',
        ],
      },
      'source': {
        'kind': 'enum',
        'values': [
          'tray',
          'application-menu',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'disabled',
        ],
      },
      'accelerator': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'desktop-menu',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'source',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'items',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action-item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'accelerator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'role-item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'submenu',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'separator',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'role',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-type': {
        'values': [
          'action',
          'role',
          'submenu',
          'separator',
        ],
      },
      'data-source': {
        'values': [
          'tray',
          'application-menu',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'active',
          'enabled',
        ],
        'parts': [
          'root',
          'action',
        ],
      },
    },
    'booleans': [
      'accelerator',
    ],
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
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Utility compatibility anatomy is included for existing shipped helpers; it does not implement a design gap.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
  {
    'name': 'desktop-dialog',
    'specId': 'K3',
    'category': 'Desktop',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'kind': {
        'kind': 'enum',
        'values': [
          'alert',
          'confirm',
          'prompt',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'disabled',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'desktop-dialog',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'copy',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'message',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'input',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-kind': {
        'values': [
          'alert',
          'confirm',
          'prompt',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'ready',
        ],
        'parts': [
          'root',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Cycle focus within modal',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss and restore trigger focus',
      },
    ],
    'tokenRoles': [
      'accent/default',
      'accent/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
