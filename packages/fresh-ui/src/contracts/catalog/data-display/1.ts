import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_1: readonly ComponentContract[] = [
  {
    'name': 'avatar',
    'specId': 'D1',
    'category': 'Data display',
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
      'content': {
        'kind': 'enum',
        'values': [
          'image',
          'initials',
          'agent',
        ],
      },
      'status': {
        'kind': 'enum',
        'values': [
          'online',
          'away',
          'offline',
        ],
      },
      'name': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'src': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'initials': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'agent': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'presence': {
        'kind': 'boolean',
      },
      'badge': {
        'kind': 'boolean',
      },
      'count': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'image',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'initials',
        'when':
          'always emitted for non-agent avatars; Utility shows initials even when src is supplied',
      },
      {
        'name': 'agent-icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'presence',
        'when': 'when the corresponding content or subcomponent is supplied',
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
      'data-content': {
        'values': [
          'image',
          'initials',
          'agent',
        ],
      },
      'data-status': {
        'values': [
          'online',
          'away',
          'offline',
        ],
        'parts': [
          'presence',
        ],
      },
    },
    'booleans': [
      'presence',
      'badge',
      'count',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/strong',
      'primary/default',
      'primary/fg',
      'success/default',
      'surface/card',
      'surface/muted',
      'text/muted',
      'warning/default',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'badge',
    'specId': 'D2',
    'category': 'Data display',
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
          'info',
          'muted',
        ],
      },
      'emphasis': {
        'kind': 'enum',
        'values': [
          'subtle',
          'strong',
          'outline',
          'dot',
        ],
      },
      'iconStart': {
        'kind': 'boolean',
      },
      'remove': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'dot',
        'when': 'decorative status marker, visible in Studio Utility',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
      },
      {
        'name': 'remove',
        'when': 'when the corresponding content or subcomponent is supplied',
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
          'info',
          'muted',
        ],
      },
      'data-emphasis': {
        'values': [
          'subtle',
          'strong',
          'outline',
          'dot',
        ],
        'plannedValues': [
          'strong',
          'outline',
          'dot',
        ],
      },
    },
    'booleans': [
      'iconStart',
      'remove',
    ],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/default',
      'border/width',
      'radius/badge',
      'space/badge/height',
      'space/badge/padding-x',
      'surface/inverse',
      'surface/muted',
      'text/fg',
      'text/inverse',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'card',
    'specId': 'D3',
    'category': 'Data display',
    'priority': 'P0',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'rule',
        ],
      },
      'size': {
        'kind': 'enum',
        'values': [
          'md',
          'sm',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
        ],
      },
      'header': {
        'kind': 'boolean',
      },
      'description': {
        'kind': 'boolean',
      },
      'action': {
        'kind': 'slot',
      },
      'footer': {
        'kind': 'boolean',
      },
      'body': {
        'kind': 'slot',
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
        'name': 'title',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'action',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'body',
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
      'data-variant': {
        'values': [
          'default',
          'rule',
        ],
        'plannedValues': [
          'rule',
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
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'header',
      'description',
      'action',
      'footer',
    ],
    'slots': [
      {
        'name': 'body',
        'part': 'body',
      },
      {
        'name': 'action',
        'part': 'action',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'border/control',
      'border/strong',
      'border/subtle',
      'radius/card',
      'space/card/padding',
      'space/stack/gap',
      'surface/card',
      'surface/surface',
      'text/card',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
