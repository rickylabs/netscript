import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const feedback_3: readonly ComponentContract[] = [
  {
    'name': 'empty-state',
    'specId': 'B7',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'media': {
        'kind': 'enum',
        'values': [
          'none',
          'icon',
          'image',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'md',
          'sm',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'heading': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'description': {
        'kind': 'boolean',
      },
      'actions': {
        'kind': 'boolean',
      },
      'border': {
        'kind': 'boolean',
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
        'name': 'media',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'heading',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'content',
      },
    ],
    'attributes': {
      'data-media': {
        'values': [
          'none',
          'icon',
          'image',
        ],
      },
      'data-size': {
        'values': [
          'md',
          'sm',
        ],
        'plannedValues': [
          'sm',
        ],
      },
    },
    'booleans': [
      'description',
      'actions',
      'border',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'radius/card',
      'space/section/gap',
      'space/stack/gap',
      'surface/muted',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
