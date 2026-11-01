import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const data_display_5: readonly ComponentContract[] = [
  {
    'name': 'collapsible',
    'specId': 'D13',
    'category': 'Data display',
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
        'kind': 'slot',
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
      {
        'name': 'label',
      },
      {
        'name': 'indicator',
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
          'rest',
          'disabled',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'label',
        'part': 'label',
      },
      {
        'name': 'children',
        'part': 'content',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle disclosure',
      },
    ],
    'tokenRoles': [
      'space/stack/gap',
      'text/muted',
      'radius/control',
      'state/disabled-opacity',
    ],
    'notes': [
      'Native details/summary retains no-JavaScript disclosure behavior. After hydration, controlled refusal preserves open and disabled summary prevents activation. Before hydration, native disclosure remains toggleable, including aria-disabled summaries. No global listeners.',
    ],
  },
  {
    'name': 'carousel',
    'specId': 'D14',
    'category': 'Data display',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'controls': {
        'kind': 'enum',
        'values': [
          'outside',
          'inside',
        ],
      },
      'dots': {
        'kind': 'boolean',
      },
      'label': {
        'kind': 'text',
        'required': true,
      },
      'slides': {
        'kind': 'collection',
        'required': true,
      },
      'counter': {
        'kind': 'boolean',
      },
      'defaultIndex': {
        'kind': 'number',
        'default': 0,
      },
      'onIndexChange': {
        'kind': 'callback',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'viewport',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'slide',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'previous',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'next',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'dots',
        'when': 'when the corresponding content or subcomponent is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'dot',
        'when': 'dots supplied',
      },
      {
        'name': 'counter',
        'when': 'counter supplied',
      },
      {
        'name': 'pagination',
        'when': 'dots or counter supplied',
      },
      {
        'name': 'empty',
        'when': 'no slides',
      },
    ],
    'attributes': {
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
      },
      'data-controls': {
        'values': [
          'outside',
          'inside',
        ],
      },
    },
    'booleans': [
      'dots',
      'counter',
    ],
    'slots': [
      {
        'name': 'slides',
        'part': 'slide',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/',
    'keyboard': [
      {
        'key': 'Tab',
        'action': 'Focus previous/next controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate control',
      },
    ],
    'tokenRoles': [
      'border/strong',
      'space/stack/gap',
      'text/fg',
    ],
    'notes': [
      'Native overflow scrolling and mandatory snap points retain touch/trackpad behavior. ResizeObserver realigns the current slide without global listeners.',
      'No autoplay. Boundary controls use guarded aria-disabled so activation never removes focus. After hydration only the current slide is interactive; before hydration native scrolling keeps all slide content available.',
      'defaultIndex is clamped to available slides; changing slide count or orientation keeps a valid current index.',
    ],
  },
];
