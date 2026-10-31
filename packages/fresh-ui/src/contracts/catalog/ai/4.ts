import type { ComponentContract } from '../../component-contract.ts';

/** Completed Figma category contracts; ledger deviations are explicit. */
export const ai_4: readonly ComponentContract[] = [
  {
    'name': 'message-scroller',
    'specId': 'I3',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'label': {
        'kind': 'text',
        'required': true,
        'description': 'Nonblank accessible native viewport name.',
      },
      'children': {
        'kind': 'slot',
      },
      'followEnd': {
        'kind': 'boolean',
        'default': true,
        'description': 'Follow growth only while already pinned; first mount pins when true.',
      },
      'endThreshold': {
        'kind': 'number',
        'default': 1,
        'description': 'Finite nonnegative native CSS pixel tolerance for pinning.',
      },
      'scrollLabel': {
        'kind': 'text',
        'default': 'Scroll to latest',
      },
      'Item.children': {
        'kind': 'slot',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'viewport',
      },
      {
        'name': 'content',
      },
      {
        'name': 'scroll-button',
      },
      {
        'name': 'item',
        'when': 'when Item is supplied',
      },
      {
        'name': 'edge-top',
        'representation': 'pseudo',
      },
      {
        'name': 'edge-bottom',
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
        'default': 'none',
        'description':
          'Derived native geometry, never an input prop. SSR none; all four states measured after hydration.',
      },
    },
    'booleans': [
      'followEnd',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'content',
      },
      {
        'name': 'Item.children',
        'part': 'item',
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
      'Caller owns finite root height or constrained flex/grid parent; native scroll anchoring and keys remain intact.',
      'Scroll button stays mounted/visible while focused after pinning; otherwise pinned/unfocused visibility hidden removes it from native tab order. No live region; host owns new-message announcements.',
      'Ledger viewport24x60, max content640 (spec720), subtle border edge rules rather than gradients; no new glyph: existing arrow-right rotates90degrees.',
    ],
  },
  {
    'name': 'marker',
    'specId': 'I4',
    'category': 'AI',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'variant': {
        'kind': 'enum',
        'values': [
          'default',
          'border',
          'separator',
        ],
        'default': 'default',
      },
      'icon': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
      },
      'label': {
        'kind': 'slot',
        'description':
          'Takes precedence over children when supplied, preserving empty text and zero.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'icon',
        'when': 'when icon supplied',
      },
      {
        'name': 'content',
      },
    ],
    'attributes': {
      'data-variant': {
        'values': [
          'default',
          'border',
          'separator',
        ],
        'default': 'default',
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
      {
        'name': 'label',
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
    'shipped': true,
    'props': {
      'status': {
        'kind': 'enum',
        'values': [
          'running',
          'done',
          'error',
        ],
        'default': 'running',
        'description': 'Aggregate status; pending is a Line status only.',
      },
      'statusLabel': {
        'kind': 'text',
        'description': 'Localizable static status text, default Running/Done/Error.',
      },
      'title': {
        'kind': 'slot',
      },
      'duration': {
        'kind': 'slot',
      },
      'children': {
        'kind': 'slot',
        'description': 'Trace.Line LI children form a native ordered list.',
      },
      'Line.status': {
        'kind': 'enum',
        'values': [
          'done',
          'running',
          'pending',
          'error',
        ],
        'default': 'pending',
      },
      'Line.statusLabel': {
        'kind': 'text',
        'description':
          'Localizable static text included in summary name, default Done/Running/Pending/Error.',
      },
      'Line.title': {
        'kind': 'slot',
        'required': true,
      },
      'Line.description': {
        'kind': 'slot',
      },
      'Line.duration': {
        'kind': 'slot',
      },
      'Line.children': {
        'kind': 'slot',
      },
      'Line.collapsible': {
        'kind': 'boolean',
        'default': false,
      },
      'Line.connector': {
        'kind': 'boolean',
        'default': true,
      },
      'Line.open': {
        'kind': 'boolean',
        'description': 'Controlled accepted disclosure state; ignored for static lines.',
      },
      'Line.defaultOpen': {
        'kind': 'boolean',
        'default': false,
      },
      'Line.onOpenChange': {
        'kind': 'callback',
        'description':
          'One proposal per native activation; refusal retains physical accepted state.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'list',
      },
      {
        'name': 'status-label',
      },
      {
        'name': 'header',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'line',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'icon',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'title',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'description',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'duration',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'disclosure',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'collapsible-trigger',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'collapsible-content',
        'when': 'when the corresponding content or line is supplied',
      },
      {
        'name': 'connector',
        'when': 'when the corresponding content or line is supplied',
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
        'parts': [
          'root',
          'line',
        ],
        'description': 'Root accepts running/done/error only; pending belongs to Line.',
      },
      'data-open': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'line',
        ],
        'description': 'Actual accepted disclosure state; static lines always false.',
      },
      'data-collapsible': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'line',
        ],
        'default': 'false',
      },
      'data-connector': {
        'values': [
          'false',
          'true',
        ],
        'parts': [
          'line',
        ],
        'default': 'true',
      },
    },
    'booleans': [
      'Line.collapsible',
      'Line.connector',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'list',
      },
      {
        'name': 'title',
        'part': 'title',
      },
      {
        'name': 'duration',
        'part': 'duration',
      },
      {
        'name': 'Line.title',
        'part': 'title',
      },
      {
        'name': 'Line.description',
        'part': 'description',
      },
      {
        'name': 'Line.duration',
        'part': 'duration',
      },
      {
        'name': 'Line.children',
        'part': 'collapsible-content',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    'keyboard': [
      {
        'key': 'Enter/Space',
        'action': 'Toggle the focused native summary',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action':
          'Move between summaries and visible native child controls; static lines add no tab stop',
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
      'Trace renders a native ordered list; Line is an LI and must be placed in Trace or a native list. Summary content is presentation only; native actions belong in collapsible-content.',
      'All statuses have static text equivalents; glyphs are decorative. No automatic live announcements or backend run state.',
      'Native open/defaultOpen and controlled refusal are reconciled after every render; static lines ignore open.',
    ],
  },
];
