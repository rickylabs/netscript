import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const overlays_4: readonly ComponentContract[] = [
  {
    'name': 'command-palette',
    'specId': 'O10',
    'category': 'Overlays',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'groups[].id': { 'kind': 'text', 'required': true },
      'groups[].label': { 'kind': 'text' },
      'groups[].items': { 'kind': 'collection', 'required': true },
      'dialogLabel': { 'kind': 'text', 'default': 'Command palette' },
      'open': {
        'kind': 'boolean',
        'description': 'Controlled modal visibility; inline defaults visible unless open=false.',
      },
      'onOpenChange': {
        'kind': 'callback',
        'description': 'Modal close request; controlled owner may refuse.',
      },
      'groups': {
        'kind': 'collection',
        'required': true,
        'description':
          'Ordered groups with globally unique nonblank item IDs and unique nonblank group IDs.',
      },
      'placeholder': {
        'kind': 'text',
        'default': 'Type a command or search…',
      },
      'emptyLabel': {
        'kind': 'text',
        'default': 'No matching commands',
      },
      'class': {
        'kind': 'text',
      },
      'loading': {
        'kind': 'boolean',
        'default': false,
      },
      'loadingLabel': {
        'kind': 'text',
        'default': 'Searching…',
      },
      'searchLabel': {
        'kind': 'text',
        'default': 'Search commands',
      },
      'onQueryChange': {
        'kind': 'callback',
        'description':
          'Reports user query edits; network/backend integration remains caller-owned.',
      },
      'scrim': {
        'kind': 'boolean',
        'default': true,
        'description': 'False uses an inline combobox without modal focus capture.',
      },
      'filters': {
        'kind': 'slot',
      },
      'footer': {
        'kind': 'slot',
      },
      'groups[].items[].type': {
        'kind': 'enum',
        'values': [
          'page',
          'section',
          'action',
        ],
        'default': 'action',
      },
      'groups[].items[].disabled': {
        'kind': 'boolean',
        'default': false,
      },
      'groups[].items[].url': {
        'kind': 'text',
      },
      'groups[].items[].excerpt': {
        'kind': 'text',
        'description': 'Plain text, escaped by Preact; never injected HTML.',
      },
      'groups[].items[].shortcut': {
        'kind': 'text',
      },
      'groups[].items[].onSelect': {
        'kind': 'callback',
        'description': 'Called once for pointer or Enter activation; caller owns navigation.',
      },
      'groups[].items[].id': {
        'kind': 'text',
        'required': true,
      },
      'groups[].items[].label': {
        'kind': 'text',
        'required': true,
      },
      'groups[].items[].icon': {
        'kind': 'text',
      },
      'groups[].items[].hash': {
        'kind': 'text',
      },
      'groups[].items[].kind': {
        'kind': 'text',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'backdrop',
        'when': 'scrim=true',
      },
      {
        'name': 'content',
      },
      {
        'name': 'input-row',
      },
      {
        'name': 'search-icon',
      },
      {
        'name': 'input',
      },
      {
        'name': 'kbd',
      },
      {
        'name': 'filters',
        'when': 'filters content is supplied',
      },
      {
        'name': 'list',
      },
      {
        'name': 'group',
        'when': 'matching group items exist and loading=false',
      },
      {
        'name': 'group-label',
        'when': 'matching group has a label',
      },
      {
        'name': 'item',
        'when': 'matching item exists and loading=false',
      },
      {
        'name': 'item-icon',
        'when': 'item icon supplied or type=section',
      },
      {
        'name': 'item-label',
        'when': 'matching item exists and loading=false',
      },
      {
        'name': 'item-url',
        'when': 'item url supplied',
      },
      {
        'name': 'item-excerpt',
        'when': 'item excerpt supplied',
      },
      {
        'name': 'item-kind',
        'when': 'item kind supplied',
      },
      {
        'name': 'item-hash',
        'when': 'item hash supplied',
      },
      {
        'name': 'empty',
        'when': 'no matching items and loading=false',
      },
      {
        'name': 'footer',
        'when': 'footer content is supplied',
      },
      {
        'name': 'focus-ring',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
      {
        'name': 'item-copy',
        'when': 'matching item exists and loading=false',
      },
      {
        'name': 'item-shortcut',
        'when': 'item shortcut supplied',
      },
      {
        'name': 'item-return',
        'when': 'matching enabled item exists; visible only while highlighted',
      },
      {
        'name': 'loading',
        'when': 'loading=true',
      },
    ],
    'attributes': {
      'data-content': {
        'values': [
          'results',
          'empty',
          'loading',
        ],
      },
      'data-type': {
        'values': [
          'page',
          'section',
          'action',
        ],
        'parts': [
          'item',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'selected',
          'disabled',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes. Utility retains these existing runtime values on the listed parts; canonical Figma values remain unchanged.',
        'compatibilityValues': [
          'open',
          'closed',
          'checked',
          'unchecked',
        ],
        'parts': [
          'backdrop',
          'input',
          'list',
          'item',
        ],
      },
      'data-scrim': {
        'values': [
          'true',
          'false',
        ],
        'default': 'true',
      },
    },
    'booleans': [
      'loading',
      'scrim',
    ],
    'slots': [
      {
        'name': 'filters',
        'part': 'filters',
      },
      {
        'name': 'footer',
        'part': 'footer',
      },
    ],
    'apg': 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    'keyboard': [
      {
        'key': 'ArrowDown/ArrowUp',
        'action':
          'Navigate matching enabled options using the existing combobox active descendant.',
      },
      {
        'key': 'Home/End',
        'action': 'Highlight first/last matching enabled option.',
      },
      {
        'key': 'Enter',
        'action':
          'Invoke the highlighted command once and request modal close; IME composition does not activate commands.',
      },
      {
        'key': 'Escape',
        'action':
          'Request modal close once; controlled refusal preserves focus and options. Inline mode clears the query.',
      },
      {
        'key': 'Tab/Shift+Tab',
        'action':
          'Native modal focus containment or inline control traversal; options remain in the active-descendant list, not the tab order.',
      },
    ],
    'tokenRoles': [
      'border/default',
      'border/subtle',
      'marker/default',
      'radius/card',
      'surface/card',
      'surface/selected',
      'surface/surface',
      'text/fg',
      'text/muted',
    ],
    'notes': [
      'Existing root and item fields remain supported; native DOM attributes do not pass through beyond class.',
      'Phase-one metadata correction: content/type/state describe derived output or item fields, not invented root props; excerpt/url/kind/shortcut are optional item content and filters/footer are slots.',
      'Headless data-state compatibility values remain unchanged; data-highlighted identifies current keyboard/pointer highlight.',
      'Local filtering matches label, url, excerpt, kind and hash text in source order; Pagefind/backend requests and navigation remain caller-owned.',
      'Disabled options remain visible but are excluded from headless arrow registration and activation. Empty/loading feedback is outside the listbox.',
      'Modal and inline composition share existing Dialog/Combobox; no new focus manager. Native IME editing is preserved.',
    ],
  },
];
