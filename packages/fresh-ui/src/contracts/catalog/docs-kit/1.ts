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
      'level': {
        'kind': 'enum',
        'values': [
          'h1',
          'h2',
          'h3',
          'h4',
        ],
      },
      'element': {
        'kind': 'enum',
        'values': [
          'lede',
          'p',
          'blockquote',
          'ul',
          'ol',
          'hr',
          'link',
          'code',
          'kbd',
          'strong',
          'em',
        ],
      },
      'state': {
        'kind': 'enum',
        'values': [
          'rest',
          'hover',
        ],
      },
      'anchor': {
        'kind': 'boolean',
      },
      'children': {
        'kind': 'slot',
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
    'attributes': {
      'data-level': {
        'values': [
          'h1',
          'h2',
          'h3',
          'h4',
        ],
      },
      'data-element': {
        'values': [
          'lede',
          'p',
          'blockquote',
          'ul',
          'ol',
          'hr',
          'link',
          'code',
          'kbd',
          'strong',
          'em',
        ],
      },
      'data-state': {
        'values': [
          'rest',
          'hover',
        ],
        'description':
          'Transient hover, focus and pressed behavior also uses native CSS pseudo-classes.',
      },
    },
    'booleans': [
      'anchor',
    ],
    'slots': [
      {
        'name': 'children',
        'part': 'root',
      },
    ],
    'apg': 'noninteractive presentation',
    'keyboard': [],
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
      'Native DOM attributes pass through where the implementation accepts them.',
      'Sanitized Markdown inner anatomy is native semantic HTML. Styles target those semantics without forcing extra wrapper nodes.',
    ],
  },
];
