import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_4: readonly ComponentContract[] = [
  {
    'name': 'command-palette',
    'specId': 'O10',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'content': {
        'kind': 'enum',
        'values': [
          'results',
          'empty',
          'loading',
        ],
      },
      'type': {
        'kind': 'enum',
        'values': [
          'page',
          'section',
          'action',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'selected',
          'disabled',
        ],
      },
      'excerpt': {
        'kind': 'boolean',
      },
      'url': {
        'kind': 'boolean',
      },
      'kind': {
        'kind': 'boolean',
      },
      'shortcut': {
        'kind': 'boolean',
      },
      'filters': {
        'kind': 'boolean',
      },
      'footer': {
        'kind': 'boolean',
      },
      'scrim': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'backdrop',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'input-row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'search-icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'input',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'kbd',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'filters',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'list',
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
        'name': 'item',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-url',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-excerpt',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-kind',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'item-hash',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'empty',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'footer',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {
      'data-content': {
        'values': [
          'results',
          'empty',
          'loading',
        ],
      },
      'data-type': {
        'values': [
          'page',
          'section',
          'action',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'selected',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'excerpt',
      'url',
      'kind',
      'shortcut',
      'filters',
      'footer',
      'scrim',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    'keyboard': [
      {
        'key': 'ArrowDown/ArrowUp',
        'action': 'Navigate options',
      },
      {
        'key': 'Enter',
        'action': 'Select option',
      },
      {
        'key': 'Escape',
        'action': 'Dismiss options',
      },
    ],
    'tokenRoles': [
      'border/default',
      'border/subtle',
      'marker/default',
      'radius/card',
      'surface/card',
      'surface/selected',
      'surface/surface',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
