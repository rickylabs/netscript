import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const ai_2: readonly ComponentContract[] = [
  {
    'name': 'model-selector',
    'specId': 'I9',
    'category': 'AI',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
      'align': {
        'kind': 'enum',
        'values': [
          'left',
          'right',
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
      'models': {
        'kind': 'collection',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'value': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'onChange': {
        'kind': 'callback',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'btn',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'provider',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'menu',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'opt',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'main',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'desc',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'check',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
      'data-align': {
        'values': [
          'left',
          'right',
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
    'booleans': [],
    'slots': [],
    'apg': 'native disclosure and option buttons',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle summary or activate an option button',
      },
      {
        'key': 'Tab',
        'action': 'Move through native option buttons',
      },
    ],
    'tokenRoles': [
      'primary/text',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
      'Native details is the disclosure; the listbox role does not add roving arrow-key behavior.',
    ],
  },
  {
    'name': 'tool-call-card',
    'specId': 'I10',
    'category': 'AI',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'status': {
        'kind': 'enum',
        'values': [
          'running',
          'done',
          'error',
        ],
      },
      'open': {
        'kind': 'enum',
        'values': [
          'false',
          'true',
        ],
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'summary',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'name',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'dot',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'chevron',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'panel',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'io',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'io-label',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'pre',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
    ],
    'attributes': {
      'data-status': {
        'values': [
          'running',
          'done',
          'error',
        ],
      },
      'data-open': {
        'values': [
          'false',
          'true',
        ],
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle disclosure',
      },
    ],
    'tokenRoles': [
      'border/default',
      'destructive/border',
      'destructive/text',
      'radius/input',
      'space/stack/gap',
      'success/text',
      'surface/surface',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
  {
    'name': 'citation-chip',
    'specId': 'I11',
    'category': 'AI',
    'priority': 'P2',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
          'focus',
          'active',
        ],
      },
      'active': {
        'kind': 'boolean',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'href': {
        'kind': 'text',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'index': {
        'kind': 'number',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'index',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'active',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [],
    'slots': [],
    'apg': 'native link',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus link',
      },
      {
        'key': 'Enter',
        'action': 'Follow link',
      },
    ],
    'tokenRoles': [
      'primary/subtle',
      'primary/text',
      'radius/badge',
      'surface/muted',
      'text/muted',
    ],
    'notes': [
      'Native DOM attributes pass through where the implementation accepts them.',
    ],
  },
];
