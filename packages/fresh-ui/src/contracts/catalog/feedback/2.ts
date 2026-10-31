import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const feedback_2: readonly ComponentContract[] = [
  {
    'name': 'progress',
    'specId': 'B4',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'primary',
          'secondary',
          'success',
          'warning',
          'destructive',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'loading',
        ],
      },
      'indeterminate': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'max': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'value': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'label': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'value',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'track',
      },
      {
        'name': 'bar',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'primary',
          'secondary',
          'success',
          'warning',
          'destructive',
        ],
      },
      'data-size': {
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'loading',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'label',
      'value',
    ],
    'slots': [],
    'apg': 'native progressbar',
    'keyboard': [],
    'tokenRoles': [
      'material/track',
      'radius/badge',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'spinner',
    'specId': 'B5',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'size': {
        'kind': 'enum',
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
      'label': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'track',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'pseudo',
      },
      {
        'name': 'arc',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'pseudo',
      },
    ],
    'attributes': {
      'data-size': {
        'values': [
          'sm',
          'md',
          'lg',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'status',
    'keyboard': [],
    'tokenRoles': [
      'border/subtle',
      'primary/default',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'skeleton',
    'specId': 'B6',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'shape': {
        'kind': 'enum',
        'values': [
          'line',
          'block',
          'circle',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
        ],
      },
      'variant': {
        'kind': 'enum',
        'values': [
          'table',
          'stats',
          'detail',
          'form',
        ],
      },
      'cards': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'columns': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'rows': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'block',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'card',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'line',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'box',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'table-row',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-shape': {
        'values': [
          'line',
          'block',
          'circle',
        ],
        'compatibilityValues': [
          'input',
          'card',
        ],
        'parts': [
          'block',
          'box',
        ],
        'description':
          ' Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
      },
      'data-size': {
        'values': [
          'xs',
          'sm',
          'md',
          'lg',
        ],
      },
      'data-variant': {
        'values': [
          'table',
          'stats',
          'detail',
          'form',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'radius/badge',
      'radius/input',
      'space/stack/gap',
      'surface/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Compatibility values describe already-shipped headless or Utility state hooks. They are separate from the settled canonical design vocabulary and must be retained by styles serving these public APIs.',
    ],
  },
];
