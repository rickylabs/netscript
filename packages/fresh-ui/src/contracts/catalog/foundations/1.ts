import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const foundations_1: readonly ComponentContract[] = [
  {
    'name': 'icon',
    'specId': 'Z1',
    'category': 'Foundations',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'name': {
        'kind': 'enum',
        'values': [
          'alert-triangle',
          'arrow-left',
          'arrow-right',
          'bell',
          'calendar',
          'check',
          'chevron-down',
          'chevron-left',
          'chevron-right',
          'chevron-up',
          'circle-alert',
          'circle-check',
          'corner-down-left',
          'copy',
          'download',
          'external-link',
          'file-text',
          'folder',
          'grip-vertical',
          'info',
          'menu',
          'minus',
          'plus',
          'search',
          'settings',
          'trash',
          'x',
        ],
        'required': true,
      },
      'size': {
        'kind': 'text',
        'description': 'CSS length or numeric SVG dimension; defaults to 1em.',
      },
      'title': {
        'kind': 'text',
        'description': 'Optional accessible title; omitted icons are decorative.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'glyph',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {},
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'text/fg',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
