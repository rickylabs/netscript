import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  CITATION_ELEMENT,
  extendSanitizeSchema,
  KATEX_TAG_NAMES,
  type MdastRoot,
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
