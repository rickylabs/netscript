import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const ai_5: readonly ComponentContract[] = [
  {
    'name': 'questionnaire',
    'specId': 'I6',
    'category': 'AI',
    'priority': 'P1',
    'shipped': false,
    'props': {
      'step': {
        'kind': 'enum',
        'values': [
          'question',
          'freeform',
          'complete',
        ],
      },
      'title': {
        'kind': 'slot',
      },
      'description': {
        'kind': 'slot',
      },
      'error': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'multiple': {
        'kind': 'boolean',
      },
    },
    'parts': [
      {
        'name': 'root',
        'planned': true,
      },
      {
        'name': 'progress',
        'planned': true,
      },
      {
        'name': 'item',
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
        'name': 'choices',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'choice',
        'planned': true,
      },
      {
        'name': 'shortcut',
        'planned': true,
      },
      {
        'name': 'label',
        'planned': true,
      },
      {
        'name': 'indicator',
        'planned': true,
      },
      {
        'name': 'input',
        'planned': true,
      },
      {
        'name': 'error',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
      {
        'name': 'actions',
        'planned': true,
        'when': 'when corresponding content is supplied',
      },
    ],
    'attributes': {
      'data-step': {
        'values': [
          'question',
          'freeform',
          'complete',
        ],
      },
    },
    'booleans': [
      'multiple',
    ],
    'slots': [
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'error',
        'part': 'error',
      },
      {
        'name': 'children',
        'part': 'choices',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
    ],
    'apg': 'native form, radio and checkbox controls',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between native controls',
      },
      {
        'key': 'Arrow keys',
        'action': 'Move between radio choices',
      },
      {
        'key': 'Space',
        'action': 'Select the focused radio or checkbox',
      },
      {
        'key': 'Enter',
        'action': 'Submit the current form',
      },
    ],
    'tokenRoles': [
      'text/fg',
      'text/muted',
      'border/default',
      'primary/stroke',
      'surface/selected',
      'destructive/text',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-ai selects with primary/stroke, not primary/default; rendering never calls an AI/backend service.',
    ],
  },
  {
    'name': 'attachment',
    'specId': 'I7',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'state': {
        'kind': 'enum',
        'values': [
          'idle',
          'uploading',
          'processing',
          'error',
          'done',
        ],
        'default': 'idle',
      },
      'size': {
        'kind': 'enum',
        'values': [
          'default',
          'sm',
          'xs',
        ],
        'default': 'default',
      },
      'orientation': {
        'kind': 'enum',
        'values': [
          'horizontal',
          'vertical',
        ],
        'default': 'horizontal',
      },
      'title': {
        'kind': 'slot',
        'required': true,
      },
      'media': {
        'kind': 'slot',
      },
      'description': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'stateLabel': {
        'kind': 'text',
        'description':
          'Localizable static non-idle state text, default Uploading/Processing/Error/Done; never a live region.',
      },
      'progress': {
        'kind': 'slot',
        'description': 'Optional caller-owned progress content; omitted at xs horizontal.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'content',
      },
      {
        'name': 'title',
      },
      {
        'name': 'media',
        'when': 'when corresponding content/state is supplied',
      },
      {
        'name': 'description',
        'when': 'when corresponding content/state is supplied',
      },
      {
        'name': 'actions',
        'when': 'when corresponding content/state is supplied',
      },
      {
        'name': 'progress',
        'when': 'when corresponding content/state is supplied',
      },
      {
        'name': 'state-label',
        'when': 'when corresponding content/state is supplied',
      },
      {
        'name': 'state-icon',
        'when': 'when corresponding content/state is supplied',
      },
    ],
    'attributes': {
      'data-state': {
        'values': [
          'idle',
          'uploading',
          'processing',
          'error',
          'done',
        ],
        'default': 'idle',
      },
      'data-size': {
        'values': [
          'default',
          'sm',
          'xs',
        ],
        'default': 'default',
      },
      'data-orientation': {
        'values': [
          'horizontal',
          'vertical',
        ],
        'default': 'horizontal',
      },
    },
    'booleans': [],
    'slots': [
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'media',
        'part': 'media',
      },
      {
        'name': 'description',
        'part': 'description',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
      {
        'name': 'progress',
        'part': 'progress',
      },
    ],
    'apg': 'native action controls in a noninteractive attachment surface',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action': 'Move between supplied native action controls',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate the focused action',
      },
    ],
    'tokenRoles': [
      'surface/card',
      'surface/muted',
      'border/default',
      'radius/input',
      'text/muted',
      'destructive/border',
      'destructive/text',
    ],
    'notes': [
      'Source: completed Figma base library handoff (#2486); ledger takes precedence over research spec.',
      'ledger-ai media sizes40/32/24; xs horizontal omits description and uses trailing state glyph.',
      'Every non-idle state has visually hidden static text at all sizes; glyphs are decorative. xs horizontal visually hides description but retains it in the accessibility tree.',
      'Native child actions remain independent; no upload, fetch, timer, remove/retry behavior or automatic live region. Media and alt text are caller-owned.',
    ],
  },
];
