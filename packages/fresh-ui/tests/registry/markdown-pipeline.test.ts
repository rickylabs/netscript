import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  CITATION_ELEMENT,
  extendSanitizeSchema,
  type HastNode,
  KATEX_TAG_NAMES,
  type MdastRoot,
  parseStyleDeclarations,
  rehypeInlineStyles,
  remarkCitations,
  type SanitizeSchema,
  stripIncompleteSyntax,
} from '../../registry/components/ui/markdown-pipeline.ts';

Deno.test('stripIncompleteSyntax closes an unterminated bold run', () => {
  const out = stripIncompleteSyntax('Here is **bold');
  assertEquals(out, 'Here is **bold**');
  assertFalse(/\*\*[^*]*$/.test(out.replace(/\*\*[^*]*\*\*/g, '')), 'no dangling bold marker');
});

Deno.test('stripIncompleteSyntax closes a truncated fenced code block', () => {
  const out = stripIncompleteSyntax('```ts\nconst x = 1');
  assert(out.endsWith('```'), `expected a closing fence, got: ${JSON.stringify(out)}`);
  // The fence count is now even (balanced).
  assertEquals((out.match(/```/g) ?? []).length % 2, 0);
});

Deno.test('stripIncompleteSyntax closes an unterminated inline code span', () => {
  assertEquals(stripIncompleteSyntax('Run `npm'), 'Run `npm`');
});

Deno.test('stripIncompleteSyntax closes unterminated inline math', () => {
  assertEquals(stripIncompleteSyntax('Euler: $e^{i'), 'Euler: $e^{i$');
});

Deno.test('stripIncompleteSyntax drops a dangling incomplete link', () => {
  assertEquals(stripIncompleteSyntax('see [the docs](https://exa'), 'see ');
});

Deno.test('stripIncompleteSyntax leaves complete input unchanged and never throws', () => {
  const complete = '# Title\n\nSome **bold** and `code` and $x$ text.\n';
  assertEquals(stripIncompleteSyntax(complete), complete);
  assertEquals(stripIncompleteSyntax(''), '');
});

Deno.test('remarkCitations rewrites [n] tokens into citation-chip render calls', () => {
  const tree: MdastRoot = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: 'See [1] and also [12].' }],
      },
    ],
  };

  remarkCitations()(tree);

  const paragraph = tree.children[0];
  const kinds = (paragraph.children ?? []).map((node) => node.type);
  // text "See " | citation | text " and also " | citation | text "."
  assertEquals(kinds, ['text', 'citationReference', 'text', 'citationReference', 'text']);

  const first = paragraph.children![1];
  assertEquals(first.data?.hName, CITATION_ELEMENT);
  assertEquals(first.data?.hProperties?.index, 1);

  const second = paragraph.children![3];
  assertEquals(second.data?.hName, CITATION_ELEMENT);
  assertEquals(second.data?.hProperties?.index, 12);
});

Deno.test('remarkCitations leaves citation-free text intact', () => {
  const tree: MdastRoot = {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: 'no citations here' }] }],
  };
  remarkCitations()(tree);
  assertEquals(tree.children[0].children?.length, 1);
  assertEquals(tree.children[0].children?.[0].type, 'text');
});

Deno.test('parseStyleDeclarations camelCases properties and keeps custom properties', () => {
  assertEquals(
    parseStyleDeclarations('height:0.8141em;margin-left:-0.0714em;'),
    { height: '0.8141em', marginLeft: '-0.0714em' },
  );
  assertEquals(parseStyleDeclarations('--ns-x: 1px; top: 0'), { '--ns-x': '1px', top: '0' });
});

Deno.test('parseStyleDeclarations skips malformed declarations without throwing', () => {
  assertEquals(parseStyleDeclarations(';;;'), {});
  assertEquals(parseStyleDeclarations('no-colon-here'), {});
  assertEquals(parseStyleDeclarations('color:'), {});
  assertEquals(parseStyleDeclarations(''), {});
});

Deno.test('rehypeInlineStyles objectifies string styles recursively', () => {
  // KaTeX-shaped tree: struts and vlists carry inline height/positioning styles
  // that MUST survive as objects (string styles are dropped by the jsx-runtime
  // when the CJS style parser fails under ESM-first bundler graphs).
  const tree: HastNode = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['strut'], style: 'height:0.8141em;' },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { style: 'top:-3.063em;margin-right:0.05em;' },
            children: [{ type: 'text' }],
          },
        ],
      },
    ],
  };

  rehypeInlineStyles()(tree);

  const outer = tree.children![0];
  assertEquals(outer.properties?.style, { height: '0.8141em' });
  const inner = outer.children![0];
  assertEquals(inner.properties?.style, { top: '-3.063em', marginRight: '0.05em' });
});

Deno.test('rehypeInlineStyles leaves object styles and style-free nodes alone', () => {
  const styleObject = { height: '1em' };
  const tree: HastNode = {
    type: 'root',
    children: [
      { type: 'element', tagName: 'span', properties: { style: styleObject } },
      { type: 'element', tagName: 'span', properties: { className: ['x'] } },
      { type: 'text' },
    ],
  };
  rehypeInlineStyles()(tree);
  assertEquals(tree.children![0].properties?.style, styleObject);
  assertEquals(tree.children![1].properties?.style, undefined);
});

Deno.test('extendSanitizeSchema never allows script or event handlers', () => {
  // A representative default-like base that (adversarially) even lists <script>.
  const base: SanitizeSchema = {
    tagNames: ['p', 'a', 'span', 'div', 'code', 'pre', 'script'],
    attributes: {
      '*': ['id'],
      a: ['href'],
    },
  };

  const schema = extendSanitizeSchema(base);

  assertFalse(schema.tagNames?.includes('script'), 'script must be stripped from the allow-list');
  assert(schema.tagNames?.includes(CITATION_ELEMENT), 'citation-chip must be allowed');
  for (const katexTag of KATEX_TAG_NAMES) {
    assert(schema.tagNames?.includes(katexTag), `KaTeX tag ${katexTag} must be allowed`);
  }

  // No attribute value on any element may be an on* event handler.
  for (const [element, values] of Object.entries(schema.attributes ?? {})) {
    for (const value of values) {
      const name = Array.isArray(value) ? String(value[0]) : String(value);
      assertFalse(
        /^on/i.test(name),
        `attribute ${name} on <${element}> must not be an event handler`,
      );
    }
  }

  // The input schema is not mutated.
  assert(base.tagNames?.includes('script'), 'input schema must be left untouched');
});
