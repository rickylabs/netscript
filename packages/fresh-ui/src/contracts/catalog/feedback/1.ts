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
          'important',
        ],
        'default': 'info',
      },
      'emphasis': {
        'kind': 'enum',
        'values': [
          'subtle',
          'strong',
        ],
        'default': 'subtle',
      },
      'children': {
        'kind': 'slot',
        'description': 'Supported Utility public prop; native attributes pass through separately.',
      },
      'icon': {
        'kind': 'slot',
        'description': 'Decorative glyph; omitted or true uses the tone default, false hides it.',
      },
      'title': {
        'kind': 'slot',
        'description':
          'Omitted uses the tone label; custom content replaces it. False/null keeps the localized tone label visually hidden for assistive technology.',
      },
      'description': {
        'kind': 'slot',
        'description': 'Takes precedence over legacy children.',
      },
      'action': {
        'kind': 'slot',
        'description': 'Caller-owned native link or button.',
      },
      'close': {
        'kind': 'boolean',
        'default': false,
      },
      'closeLabel': {
        'kind': 'text',
        'default': 'Dismiss notification',
      },
      'open': {
        'kind': 'boolean',
        'description': 'Controlled visibility; dismissal requests may be refused.',
      },
      'defaultOpen': {
        'kind': 'boolean',
        'default': true,
      },
      'onOpenChange': {
        'kind': 'callback',
        'description':
          'Receives false on native dismiss activation; native onClose remains a DOM event.',
      },
      'toneLabel': {
        'kind': 'text',
        'description':
          'Localized default tone label; blank falls back to Note, Info, Success, Warning, Error or Important.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon',
        'when': 'unless icon is false',
      },
      {
        'name': 'body',
      },
      {
        'name': 'title',
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
        'when': 'emphasis is strong',
        'representation': 'pseudo',
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
          'important',
        ],
        'default': 'info',
      },
      'data-emphasis': {
        'values': [
          'subtle',
          'strong',
        ],
        'default': 'subtle',
      },
      'data-state': {
        'values': [
          'open',
          'closed',
        ],
        'default': 'open',
      },
    },
    'booleans': [
      'close',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'description',
      },
      {
        'name': 'icon',
        'part': 'icon',
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
        'name': 'action',
        'part': 'actions',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action':
          'Traverse supplied action controls and optional close button in native order; hidden banners are skipped.',
      },
      {
        'key': 'Enter/Space',
        'action': 'Activate the close button; request open=false without moving focus on mount.',
      },
    ],
    'tokenRoles': [
      'border/default',
      'border/width',
      'destructive/border',
      'destructive/subtle',
      'destructive/text',
      'important/border',
      'important/subtle',
      'important/text',
      'info/border',
      'info/subtle',
      'info/text',
      'marker/default',
      'radius/card',
      'size/icon/md',
      'space/card/padding',
      'space/control/gap',
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
      'Original four tone names and default info live-region role remain compatible; warning/destructive default to alert, other tones to status.',
      'Closed banners remain mounted with native hidden and explicit display:none; visibility is independent of caller hidden. No automatic focus management.',
      'Strong emphasis is a CSS leading rule. Optional named content slots accept Renderable values; 0 remains valid content.',
      'Every banner has a visible tone or custom title by default; title=false/null opts into visually hidden tone text. Title uses body size and Medium label weight.',
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
      {
        'name': 'title-row',
        'when': 'Utility compatibility anatomy when the corresponding content is supplied',
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
      'Utility compatibility anatomy is included for existing shipped helpers; it does not implement a design gap.',
    ],
  },
];
