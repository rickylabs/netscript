import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const ai_4: readonly ComponentContract[] = [
  {
    'name': 'message-scroller',
    'specId': 'I3',
    'category': 'AI',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'scrollable': {
        'kind': 'enum',
        'values': [
          'none',
          'up',
          'down',
          'both',
        ],
      },
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'viewport',
        'planned': true,
      },
      {
        'name': 'content',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'item',
        'planned': true,
      },
      {
        'name': 'scroll-button',
        'planned': true,
      },
      {
        'name': 'edge-top',
        'planned': true,
        'representation': 'pseudo',
      },
      {
        'name': 'edge-bottom',
        'planned': true,
        'representation': 'pseudo',
      },
    ],
    'attributes': {
      'data-scrollable': {
        'values': [
          'none',
          'up',
          'down',
          'both',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'children',
        'part': 'content',
      },
    ],
    'apg': 'native scrollable region and button',
    'keyboard': [
      {
        'key': 'Arrow keys/PageUp/PageDown/Home/End',
        'action': 'Scroll the focused viewport',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate the scroll-to-latest button',
      },
    ],
    'tokenRoles': [
      'surface/bg',
      'space/section/gap',
      'border/subtle',
      'radius/control',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-ai uses border/subtle edge rules, not gradients; scroll button keeps radius/control.',
    ],
  },
  {
    'name': 'marker',
    'specId': 'I4',
    'category': 'AI',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'border',
          'separator',
        ],
      },
      'icon': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'icon',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'content',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'border',
          'separator',
        ],
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'icon',
        'part': 'icon',
      },
      {
        'name': 'children',
        'part': 'content',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
    'tokenRoles': [
      'text/muted',
      'border/subtle',
      'border/default',
      'radius/input',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
    ],
  },
  {
    'name': 'trace',
    'specId': 'I5',
    'category': 'AI',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'status': {
        'kind': 'enum',
        'values': [
          'done',
          'running',
          'pending',
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
      'children': {
        'kind': 'slot',
      },
      'title': {
        'kind': 'slot',
      },
      'description': {
        'kind': 'slot',
      },
      'duration': {
        'kind': 'slot',
      },
      'collapsible': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'line',
        'planned': true,
      },
      {
        'name': 'icon',
        'planned': true,
      },
      {
        'name': 'title',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'description',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'duration',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'collapsible-trigger',
        'planned': true,
      },
      {
        'name': 'collapsible-content',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'connector',
        'planned': true,
      },
    ],
    'attributes': {
      'data-status': {
        'values': [
          'done',
          'running',
          'pending',
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
    'booleans': [
      'collapsible',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'collapsible-content',
      },
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'duration',
        'part': 'duration',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle the focused disclosure',
      },
    ],
    'tokenRoles': [
      'text/muted',
      'success/text',
      'destructive/text',
      'border/subtle',
      'space/inline/gap',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-ai adds duration and success check icon; running uses warning spinner. Status pending belongs to Trace line; the Trace aggregate draws running/done/error.',
    ],
  },
];
