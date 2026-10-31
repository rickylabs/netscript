import type { ComponentContract } from '../../component-contract.ts';

/** Owner-approved component specification data. */
export const docs_kit_1: readonly ComponentContract[] = [
  {
    'name': 'prose',
    'specId': 'X1',
    'category': 'Docs kit',
    'priority': 'P1',
    'shipped': true,
    'props': {
      'children': {
        'kind': 'text',
        'required': true,
        'description': 'Raw Markdown source; sanitizer is mandatory and not caller-configurable.',
      },
      'streaming': {
        'kind': 'boolean',
        'default': false,
      },
      'activeCite': {
        'kind': 'number',
        'description': 'Active citation index; callback behavior belongs to the hydrated caller.',
      },
      'onCite': {
        'kind': 'callback',
        'description': 'Reports activation of a nested native CitationChip.',
      },
      'class': {
        'kind': 'text',
        'description': 'Wrapper classes; ns-lede opts into first-paragraph lede styling.',
      },
    },
    'parts': [
      {
        'name': 'root',
      },
      {
        'name': 'heading',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'anchor',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'lede',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'paragraph',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'blockquote',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'list',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'list-item',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'rule',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'link',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'code',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'kbd',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'strong',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'emphasis',
        'when': 'when the corresponding content or subcomponent is supplied',
        'representation': 'native',
      },
      {
        'name': 'underline',
        'representation': 'pseudo',
        'when': 'matching CSS interaction or variant',
      },
    ],
    'attributes': {},
    'booleans': [],
    'slots': [],
    'apg': 'noninteractive presentation',
    'keyboard': [
      {
        'key': 'Tab/Shift+Tab',
        'action':
          'Traverse native content links and nested citation controls; prose adds no composite focus manager.',
      },
      {
        'key': 'Enter',
        'action': 'Follow native links, including host-generated heading anchors.',
      },
    ],
    'tokenRoles': [
      'SF:prose/code/size',
      'SF:prose/h2|h3|h4/size|line|tracking',
      'SF:prose/measure',
      'border/subtle',
      'font/heading',
      'font/mono',
      'font/sans',
      'link/underline',
      'marker/default',
      'radius/badge',
      'surface/surface',
      'text/fg',
      'text/muted',
      'type/strong/style',
    ],
    'notes': [
      'Copied Markdown accepts exactly its documented renderer props; native DOM attributes do not pass through.',
      'Phase-one metadata correction: removed nonfunctional level, element, state and anchor root props and data-level/data-element/data-state axes. They were never accepted or emitted by the published Markdown renderer; native semantic styling remains available.',
      'Design level/element/state axes are native semantic elements and CSS pseudo-classes, not invented root props or data attributes.',
      'Sanitized Markdown inner anatomy is native semantic HTML. Styles target those semantics without forcing extra wrapper nodes.',
      'The public ns-markdown stylesheet also supports host-authored lede, kbd and heading-anchor markup. The copied renderer does not generate heading IDs/anchors or allow raw HTML; those remain host-owned.',
      'Native list markers retain list semantics and square bullets; glyph metrics remain browser/font-owned.',
      'The handoff Theme-set prose twins correspond to existing Studio prose CSS aliases. No token values change; lede uses prose measure as the latest ledger specifies.',
    ],
  },
];
