import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_3: readonly ComponentContract[] = [
  {
    'name': 'hover-card',
    'specId': 'O7',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
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
      'open': {
        'kind': 'boolean',
      },
      'defaultOpen': {
        'kind': 'boolean',
      },
      'onOpenChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'triggerLabel': {
        'kind': 'text',
        'required': true,
      },
      'title': {
        'kind': 'text',
        'required': true,
      },
      'description': {
        'kind': 'slot',
        'required': true,
      },
      'avatar': {
        'kind': 'slot',
        'required': false,
      },
      'meta': {
        'kind': 'slot',
        'required': false,
      },
      'closeDelay': {
        'kind': 'number',
        'default': 150,
        'description': 'Pointer transfer grace in milliseconds; focused content stays open.',
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
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'meta',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'avatar',
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
        'parts': [
          'root',
          'trigger',
          'content',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'root',
          'trigger',
          'content',
        ],
        'compatibilityValues': [
          'closed',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'avatar',
        'part': 'avatar',
      },
      {
        'name': 'meta',
        'part': 'meta',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle disclosure',
      },
      {
        'key': 'Escape',
        'action': 'Close only the open preview and return trigger focus.',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Native focus navigation; preview never traps focus or steals it on entry.',
      },
    ],
    'tokenRoles': [
      'text/muted',
    ],
    'notes': [
      'Public Popover with focusOnOpen=false; hover/focus preview and native disclosure button preserve trigger focus.',
      'Mouse hover previews; clicking an already-hovered trigger closes it. Touch/pen use activation-only toggle and pointer-induced focus does not open separately. Pointer transfer grace allows selecting/using preview content. Native focus exit/outside dismissal closes; no backend profile lookup.',
      'Runtime trigger/content retain open/closed; root uses rest/open.',
    ],
  },
  {
    'name': 'dropdown-menu',
    'specId': 'O8',
    'category': 'Overlays',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'initialFocus': {
        'kind': 'enum',
        'values': [
          'first',
          'last',
        ],
        'default': 'first',
        'description': 'ActionMenu.Content entry edge for ArrowDown/ArrowUp.',
      },
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
      'role': {
        'kind': 'enum',
        'values': [
          'menuitem',
          'menuitemcheckbox',
          'menuitemradio',
        ],
        'description':
          'ActionMenu.Item semantic role; choice state supplied with native aria-checked.',
      },
      'closeOnSelect': {
        'kind': 'boolean',
        'default': true,
        'description': 'ActionMenu.Item may stay open for repeated choice adjustments.',
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
      'Utility ActionMenu delegates all parts to the popover scope so existing app-owned floating.css retains positioning and visibility behavior.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
      'Item traversal includes checkable roles and typeahead, excludes nested menus, and respects native disabled. Outside dismissal preserves its focus destination.',
    ],
  },
  {
    'name': 'context-menu',
    'specId': 'O9',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'open': {
        'kind': 'boolean',
      },
      'defaultOpen': {
        'kind': 'boolean',
      },
      'onOpenChange': {
        'kind': 'callback',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'label': {
        'kind': 'text',
        'required': true,
      },
      'items': {
        'kind': 'collection',
        'required': true,
      },
      'children': {
        'kind': 'slot',
        'required': true,
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
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
      'data-state': {
        'values': [
          'open',
          'closed',
        ],
        'parts': [
          'content',
        ],
        'description': 'Native menu runtime visibility.',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'trigger',
      },
    ],
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
        'key': 'Shift+F10/ContextMenu',
        'action': 'Open at the focused context region.',
      },
      {
        'key': 'Home/End/printable character',
        'action': 'Traverse current menu using shared ActionMenu behavior.',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Close and leave through the native focusable region.',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Focusable native group region supports pointer contextmenu and Shift+F10/ContextMenu invocation; rich content can retain its own native semantics.',
      'Shared ActionMenu content owns menu keys and choices/submenus; native top layer plus fixed client coordinates provide pointer placement and viewport clamping.',
      'Explicit Escape/action restores context-region focus; outside dismissal keeps its destination. Browser-forced native dismissal remains platform-owned.',
    ],
  },
];
