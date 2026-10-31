import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { CodeBlock } from '../../../../registry/components/ui/code-block.tsx';

Deno.test('CodeBlock preserves native chrome, classes and escaped exact clipboard source', () => {
  const code = '<script>alert("hello")</script>\nconst x = 1;';
  const html = render(
    <CodeBlock code={code} filename='gateway.ts' lang='ts' class='custom' id='source' />,
  );
  for (
    const value of [
      'ns-code custom',
      'gateway.ts',
      'ns-code__lang',
      'ns-code__copy',
      'id="source"',
      '&lt;script>',
      'data-variant="single"',
    ]
  ) assertStringIncludes(html, value);
  assert(!html.includes('<script>'));
  assertStringIncludes(html, 'data-clipboard="&lt;script>');
});

Deno.test('CodeBlock omits optional metadata and preserves published variants/header aliases', () => {
  const html = render(<CodeBlock code='x' />);
  assert(!html.includes('ns-code__name'));
  assert(!html.includes('ns-code__lang'));
  assertStringIncludes(html, 'ns-code__copy');
  for (const header of ['none', 'title', 'tabs'] as const) {
    const legacy = render(<CodeBlock code='x' filename='a.ts' header={header} />);
    assertStringIncludes(legacy, `data-header="${header === 'none' ? 'none' : 'title'}"`);
    assertStringIncludes(legacy, 'data-variant="single"');
    if (header !== 'none') {
      assertStringIncludes(legacy, 'data-part="name">a.ts');
      assertStringIncludes(legacy, 'data-clipboard="x"');
    }
  }
  for (const variant of ['default', 'destructive', 'added', 'removed', 'highlighted'] as const) {
    const result = render(<CodeBlock code='x' variant={variant} header='none' />);
    assertStringIncludes(result, `data-variant="${variant}"`);
    assert(!result.includes('ns-code__copy'));
    if (variant === 'destructive') assertStringIncludes(result, 'data-tone="destructive"');
    if (['added', 'removed', 'highlighted'].includes(variant)) {
      assertStringIncludes(result, `data-line-variant="${variant}"`);
    }
  }
});

Deno.test('CodeBlock diff derives resulting source without removed rows and renders all syntax roles', () => {
  const types = [
    'keyword',
    'function',
    'type',
    'string',
    'number',
    'comment',
    'punctuation',
  ] as const;
  const html = render(
    <CodeBlock
      variant='diff'
      lineNumbers
      footer
      lines={[
        { text: 'old', variant: 'removed' },
        { text: 'new', variant: 'added', number: 9 },
        {
          text: 'same',
          variant: 'highlighted',
          content: types.map((type) => (
            <CodeBlock.Token key={type} type={type}>{type}</CodeBlock.Token>
          )),
        },
      ]}
    />,
  );
  assertStringIncludes(html, 'data-clipboard="new\nsame"');
  assertStringIncludes(html, '1 addition');
  assertStringIncludes(html, '1 deletion');
  assertStringIncludes(html, 'data-part="line-number">9');
  for (const type of types) assertStringIncludes(html, `data-syntax="${type}"`);
  const exact = 'exact\r\nsource';
  const explicit = render(<CodeBlock code={exact} lines={[{ text: 'display' }]} />);
  assertStringIncludes(explicit, 'data-clipboard="exact\r\nsource"');
});

Deno.test('CodeBlock file tabs retain valid relationships without optional chrome', () => {
  const html = render(
    <CodeBlock
      header={false}
      defaultValue='src/second file.ts'
      tabs={[
        { value: 'first', label: 'First', code: 'one' },
        { value: 'src/second file.ts', label: 'Second', code: 'two' },
      ]}
    />,
  );
  assertStringIncludes(html, 'role="tablist"');
  assertStringIncludes(html, 'role="tabpanel"');
  assertStringIncludes(html, 'src%2Fsecond%20file.ts');
  assertEquals((html.match(/aria-selected="true"/g) ?? []).length, 1);
  assertEquals((html.match(/ hidden/g) ?? []).length, 1);
  assert(!html.includes('data-part="head"'));
  assert(!html.includes('data-part="copy"'));
  for (
    const tabs of [[], [{ value: 'same', label: 'One' }, { value: 'same', label: 'Two' }], [{
      value: ' ',
      label: 'Empty',
    }]]
  ) {
    assertThrows(() => render(<CodeBlock variant='tabbed' tabs={tabs} />), RangeError);
  }
});

Deno.test('CodeBlock renders chrome with filename, lang, copy, and code', () => {
  const json = render(<CodeBlock code='const x = 1;' filename='gateway.ts' lang='ts' />);
  assert(json.includes('class="ns-code"'), 'base class');
  assert(json.includes('gateway.ts'), 'filename rendered');
  assert(json.includes('ns-code__lang'), 'lang part rendered');
  assert(json.includes('ns-code__copy'), 'copy affordance rendered');
  assert(json.includes('const x = 1;'), 'code rendered');
});

Deno.test('CodeBlock omits name/lang when not provided but keeps copy', () => {
  const json = render(<CodeBlock code='x' />);
  assert(!json.includes('ns-code__name'), 'no filename part');
  assert(!json.includes('ns-code__lang'), 'no lang part');
  assert(json.includes('ns-code__copy'), 'copy always present');
});

Deno.test('CodeBlock highlights recognized source while preserving the exact clipboard payload', () => {
  const source = 'const greeting = "hello"; // note';
  const html = render(<CodeBlock code={source} lang='ts' />);
  assert(html.includes('class="hljs-keyword"'), 'keyword has a syntax role');
  assert(html.includes('class="hljs-string"'), 'string has a syntax role');
  assert(html.includes('class="hljs-comment"'), 'comment has a syntax role');
  assert(html.includes('data-clipboard="const greeting = &quot;hello&quot;; // note"'));
});

Deno.test('CodeBlock escapes hostile source in highlighted and plain fallback languages', () => {
  const source = '<script>alert(1)</script><img src=x onerror="alert(2)">';
  for (const lang of ['html', 'typescript', 'unknown-language', undefined]) {
    const html = render(<CodeBlock code={source} lang={lang} />);
    assert(!html.includes('<script>') && !html.includes('<img '), 'source never becomes live DOM');
    assert(html.includes('&lt;'), 'source stays escaped');
  }
  assert(!render(<CodeBlock code={source} lang='unknown-language' />).includes('hljs-'));
});
