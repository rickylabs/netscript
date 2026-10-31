import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const forms_5: readonly ComponentContract[] = [
  {
    'name': 'calendar',
    'specId': 'F13',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'months': {
        'kind': 'enum',
        'values': [
          '1',
          '2',
        ],
      },
      'caption': {
        'kind': 'enum',
        'values': [
          'label',
          'dropdown',
        ],
      },
      'mode': {
        'kind': 'enum',
        'values': [
          'single',
          'range',
        ],
        'default': 'single',
      },
      'value': {
        'kind': 'collection',
        'description': 'Ordered ISO date strings; single has at most one and range at most two.',
      },
      'defaultValue': {
        'kind': 'collection',
        'description': 'Ordered ISO date strings; single has at most one and range at most two.',
      },
      'defaultMonth': {
        'kind': 'text',
      },
      'today': {
        'kind': 'text',
        'description':
          'Defaults to the current UTC date. Pass the user-local ISO date when local-day highlighting is required.',
      },
      'min': {
        'kind': 'text',
      },
      'max': {
        'kind': 'text',
      },
      'locale': {
        'kind': 'text',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'autoFocus': {
        'kind': 'boolean',
      },
      'onValueChange': {
        'kind': 'callback',
      },
      'isDateDisabled': {
        'kind': 'callback',
      },
      'weekStartsOn': {
        'kind': 'enum',
        'values': [
          '0',
          '1',
        ],
        'default': 0,
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-prev',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'caption',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'nav-next',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'weekdays',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'grid',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'day',
      },
    ],
    'attributes': {
      'data-months': {
        'values': [
          '1',
          '2',
        ],
      },
      'data-caption': {
        'values': [
          'label',
          'dropdown',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
          'today',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
        'parts': [
          'day',
        ],
      },
      'data-range': {
        'values': [
          'none',
          'start',
          'middle',
          'end',
        ],
        'parts': [
          'day',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/',
    'keyboard': [
      {
        'key': 'Arrow keys',
        'action': 'Move between cells',
      },
      {
        'key': 'Home/End',
        'action': 'Move to first/last cell',
      },
      {
        'key': 'PageUp/PageDown',
        'action': 'Move one month, preserving or clamping the day; Shift moves one year.',
      },
      {
        'key': 'Enter/Space',
        'action': 'Select the focused enabled day.',
      },
    ],
    'tokenRoles': [
      'primary/default',
      'primary/fg',
      'radius/input',
      'surface/muted',
      'surface/selected',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'UTC Gregorian ISO API; native buttons and select captions. Day state/range are derived, with CSS hover/focus; no caller state simulation. Only endpoints get selected visual state; middle cells remain aria-selected with range fill.',
      'Hydrate inside an island. Disabled/out-of-bounds dates are skipped; browsing alone never changes selection.',
    ],
  },
  {
    'name': 'date-picker',
    'specId': 'F14',
    'category': 'Forms',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'mode': {
        'kind': 'enum',
        'values': [
          'single',
          'range',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'focus',
          'disabled',
          'invalid',
        ],
      },
      'label': {
        'kind': 'text',
        'required': true,
      },
      'name': {
        'kind': 'text',
      },
      'defaultMonth': {
        'kind': 'text',
      },
      'min': {
        'kind': 'text',
      },
      'max': {
        'kind': 'text',
      },
      'placeholder': {
        'kind': 'text',
      },
      'locale': {
        'kind': 'text',
      },
      'value': {
        'kind': 'collection',
      },
      'defaultValue': {
        'kind': 'collection',
      },
      'open': {
        'kind': 'boolean',
      },
      'defaultOpen': {
        'kind': 'boolean',
      },
      'disabled': {
        'kind': 'boolean',
      },
      'onValueChange': {
        'kind': 'callback',
      },
      'onOpenChange': {
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
      {
        'name': 'title',
      },
      {
        'name': 'description',
      },
      {
        'name': 'close',
      },
    ],
    'attributes': {
      'data-mode': {
        'values': [
          'single',
          'range',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'focus',
          'open',
          'disabled',
          'invalid',
        ],
        'description':
          'Root derives open from Dialog; trigger/content retain its native runtime open/closed values.',
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
      'surface/card',
      'text/fg',
    ],
    'notes': [
      'Calendar embedded in package-owned native modal Dialog; uses existing focus, Escape and return behavior.',
      'Browser-forced dismissal can supersede a rejected close request; applications should normally accept native close requests.',
      'ISO value collection and open state can each be controlled. A named hidden input submits dates joined by /. Open data-state is derived; hydrate in an island.',
    ],
  },
  {
    'name': 'search',
    'specId': 'F15',
    'category': 'Forms',
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
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
        ],
      },
      'kbd': {
        'kind': 'boolean',
      },
      'label': {
        'kind': 'text',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon',
      },
      {
        'name': 'label',
      },
      {
        'name': 'kbd',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'open',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'kbd',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    'keyboard': [
      {
        'key': 'Enter',
        'action': 'Activate',
      },
      {
        'key': 'Space',
        'action': 'Activate button; links use native Enter',
      },
    ],
    'tokenRoles': [
      'border/default',
      'border/hover',
      'radius/input',
      'surface/card',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
