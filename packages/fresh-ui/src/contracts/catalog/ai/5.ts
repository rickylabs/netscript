import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const ai_5: readonly ComponentContract[] = [
  {
    'name': 'questionnaire',
    'specId': 'I6',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'step': {
        'kind': 'enum',
        'values': [
          'question',
          'freeform',
          'complete',
        ],
        'default': 'question',
      },
      'title': {
        'kind': 'slot',
        'required': true,
      },
      'description': {
        'kind': 'slot',
      },
      'error': {
        'kind': 'slot',
      },
      'progress': {
        'kind': 'slot',
      },
      'actions': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
      'options': {
        'kind': 'collection',
        'description': 'Unique nonempty value, label, optional decorative shortcut and disabled.',
      },
      'multiple': {
        'kind': 'boolean',
        'default': false,
      },
      'name': {
        'kind': 'text',
        'default': 'answer',
        'description': 'Native answer control name scoped per form.',
      },
      'disabled': {
        'kind': 'boolean',
        'default': false,
      },
      'value': {
        'kind': 'collection',
        'description': 'Controlled readonly accepted choice values; single uses first only.',
      },
      'defaultValue': {
        'kind': 'collection',
        'description': 'Initial uncontrolled values, default empty.',
      },
      'onValueChange': {
        'kind': 'callback',
      },
      'text': {
        'kind': 'text',
        'description': 'Controlled accepted freeform text.',
      },
      'defaultText': {
        'kind': 'text',
        'default': '',
      },
      'onTextChange': {
        'kind': 'callback',
      },
      'placeholder': {
        'kind': 'text',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'item',
      },
      {
        'name': 'title',
      },
      {
        'name': 'progress',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'description',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'choices',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'choice',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'shortcut',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'label',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'indicator',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'input',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'error',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'actions',
        'when': 'when corresponding content or answer control is supplied',
      },
      {
        'name': 'content',
        'when': 'when corresponding content or answer control is supplied',
      },
    ],
    'attributes': {
      'data-step': {
        'values': [
          'question',
          'freeform',
          'complete',
        ],
        'default': 'question',
      },
      'data-multiple': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'choices',
          'choice',
        ],
        'default': 'false',
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
          'focus',
          'selected',
          'disabled',
        ],
        'parts': [
          'choice',
        ],
        'description':
          'Accepted checked/disabled state; transient hover/focus use native pseudo-classes.',
      },
    },
    'booleans': [
      'multiple',
      'disabled',
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
        'name': 'progress',
        'part': 'progress',
      },
      {
        'name': 'actions',
        'part': 'actions',
      },
      {
        'name': 'children',
        'part': 'content',
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
        'action': 'Move within native radio groups',
      },
      {
        'key': 'Space',
        'action': 'Select a focused native radio or checkbox',
      },
      {
        'key': 'Enter',
        'action':
          'Activate a focused submit button; textarea Enter retains native newline behavior',
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
      'One real form; never nest inside another form. Caller owns native onSubmit/FormData, progression, validation messages and action button types.',
      'Controlled proposals restore all owned radio/checkbox siblings and textarea before callbacks. Native reset then a guarded microtask restores accepted controlled/initial uncontrolled state only; other supplied native fields keep platform behavior.',
      'Actions are outside the disabled answer fieldset. Shortcut text is decorative, not an installed hotkey. Complete renders no answer inputs or hidden persisted values.',
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
