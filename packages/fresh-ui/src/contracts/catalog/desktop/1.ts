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
        'description':
          'Presentation snapshot only. Omitted actions: macos close/hide/reload; windows/linux hide/reload/close; omitted platform reload/hide/close. Explicit actions preserve caller order.',
      },
      'state': {
        'kind': 'enum',
        'values': [
          'focused',
          'blurred',
          'disabled',
          'hover',
          'unfocused',
        ],
        'description':
          'Emitted verbatim; blurred/unfocused share visuals without disabling actions. disabled prop or state disables all native buttons.',
      },
      'title': {
        'kind': 'text',
        'description': 'Window title; retains caller render-content support.',
        'required': true,
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
      'leading': {
        'kind': 'slot',
        'description': 'Optional caller content before title.',
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
          'hover',
          'unfocused',
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
      'data-action': {
        'values': [
          'show',
          'hide',
          'focus',
          'reload',
          'close',
        ],
        'parts': [
          'action',
        ],
        'description':
          'Public styling operation identity. Legacy data-desktop-action is a private callback payload.',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'leading',
        'part': 'leading',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Visit enabled native window operation buttons in DOM order',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate focused native window operation exactly once',
      },
    ],
    'tokenRoles': [
      'border/subtle',
      'destructive/default',
      'destructive/fg',
      'surface/surface',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
      'The frame remains presentational; only native child buttons are interactive. No native action runs on render or focus.',
      'hover/unfocused are additive ledger states. Published focused/blurred/disabled and legacy active/enabled remain.',
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
        'description':
          'Optional declaration-kind presentation snapshot; never filters or rewrites items.',
      },
      'source': {
        'kind': 'enum',
        'values': [
          'tray',
          'application-menu',
        ],
        'required': true,
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'disabled',
        ],
        'description':
          'Optional verbatim snapshot; omission retains active/enabled compatibility. disabled prop or state disables actions.',
      },
      'accelerator': {
        'kind': 'boolean',
        'default': true,
        'description':
          'Show caller shortcut labels without executing shortcuts or rewriting declarations.',
      },
      'items': {
        'kind': 'collection',
        'description':
          'Required ordered recursive declarations; stable action IDs are callback payloads.',
        'required': true,
      },
      'onAction': {
        'kind': 'callback',
        'description': 'Receives only the explicitly activated enabled action ID.',
      },
      'disabled': {
        'kind': 'boolean',
        'description': 'Disable summary and all action declarations.',
        'default': false,
      },
      'Item.type': {
        'kind': 'enum',
        'description': 'Declaration discriminator; no checkbox kind is invented.',
        'values': [
          'action',
          'role',
          'submenu',
          'separator',
        ],
      },
      'Item.id': {
        'kind': 'text',
        'description': 'Stable action payload; duplicate IDs preserve separate DOM traversal.',
      },
      'Item.label': {
        'kind': 'text',
        'description': 'Action or expanded submenu label.',
      },
      'Item.accelerator': {
        'kind': 'text',
        'description': 'Optional action shortcut label.',
      },
      'Item.enabled': {
        'kind': 'boolean',
        'description': 'False disables an individual action.',
        'default': true,
      },
      'Item.role': {
        'kind': 'text',
        'description': 'Native OS role; read-only disabled browser preview.',
      },
      'Item.items': {
        'kind': 'collection',
        'description': 'Expanded submenu declarations with labelled group ownership.',
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
        'parts': [
          'root',
          'action-item',
          'role-item',
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
      {
        'key': 'Enter/Space on summary',
        'action':
          'Toggle native disclosure; enabled actions remain native Tab stops before hydration',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Leave naturally and close after focus enters then leaves this hydrated menu',
      },
    ],
    'tokenRoles': [
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Utility compatibility anatomy is included for existing shipped helpers; it does not implement a design gap.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
      'Initially-open native details preserves every enabled action in SSR/no-script Tab order. Arrow roving, Escape and Tab-to-close require a caller island. No mount focus.',
      'Submenus are expanded labelled groups; OS roles are disabled read-only menuitem previews. Native host outcomes remain separate.',
      'Legacy data-action-id is a private callback payload; no CSS reads it.',
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
