import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const feedback_1: readonly ComponentContract[] = [
  {
    'name': 'alert',
    'specId': 'B1',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'neutral',
          'info',
          'success',
          'warning',
          'destructive',
        ],
      },
      'emphasis': {
        'kind': 'enum',
        'values': [
          'subtle',
          'strong',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'icon': {
        'kind': 'boolean',
      },
      'title': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'action': {
        'kind': 'boolean',
      },
      'close': {
        'kind': 'boolean',
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
        'name': 'body',
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
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'close',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'rule',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'neutral',
          'info',
          'success',
          'warning',
          'destructive',
        ],
        'plannedValues': [
          'neutral',
        ],
      },
      'data-emphasis': {
        'values': [
          'subtle',
          'strong',
        ],
        'plannedValues': [
          'strong',
        ],
      },
    },
    'booleans': [
      'icon',
      'title',
      'description',
      'action',
      'close',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'border/width',
      'destructive/border',
      'destructive/subtle',
      'destructive/text',
      'info/border',
      'info/subtle',
      'info/text',
      'marker/default',
      'radius/card',
      'space/control/padding-x',
      'space/stack/gap',
      'success/border',
      'success/subtle',
      'success/text',
      'surface/surface',
      'text/fg',
      'text/muted',
      'warning/border',
      'warning/subtle',
      'warning/text',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'inline-notice',
    'specId': 'B2',
    'category': 'Feedback',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'neutral',
          'info',
          'success',
          'warning',
          'destructive',
        ],
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
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
        'name': 'body',
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
        'name': 'actions',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'close',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'neutral',
          'info',
          'success',
          'warning',
          'destructive',
        ],
        'plannedValues': [
          'neutral',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'status',
    'keyboard': [],
    'tokenRoles': [
      'radius/input',
      'space/stack/gap',
      'surface/surface',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'toast',
    'specId': 'B3',
    'category': 'Feedback',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'type': {
        'kind': 'enum',
        'values': [
          'default',
          'success',
          'error',
          'warning',
          'info',
          'loading',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'exiting',
        ],
      },
      'message': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'title': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'duration': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'cleanUrl': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'eyebrow': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'action': {
        'kind': 'boolean',
      },
      'dismiss': {
        'kind': 'boolean',
      },
      'progress': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'panel',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'symbol',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'title-group',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'eyebrow',
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
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'dismiss',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'progress-track',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'progress-bar',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-type': {
        'values': [
          'default',
          'success',
          'error',
          'warning',
          'info',
          'loading',
        ],
        'plannedValues': [
          'default',
          'loading',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'exiting',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'eyebrow',
      'description',
      'action',
      'dismiss',
      'progress',
    ],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    'keyboard': [],
    'tokenRoles': [
      'material/track',
      'space/stack/gap',
      'surface/muted',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'type=error is retained to match the settled Figma set; it uses destructive token roles.',
    ],
  },
];
