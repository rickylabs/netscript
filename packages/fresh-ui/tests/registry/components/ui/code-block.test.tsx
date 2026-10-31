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

Deno.test('CodeBlock preserves multiline lexical state across independent numbered diff rows', () => {
  const html = render(
    <CodeBlock
      lang='typescript'
      variant='diff'
      lineNumbers
      lines={[
        { text: '/* open', variant: 'removed' },
        { text: 'const value = 42;', variant: 'added' },
        { text: '*/ const answer = "yes";', variant: 'highlighted' },
      ]}
    />,
  );
  assertStringIncludes(html, 'class="hljs-comment">const value = 42;</span>');
  assertStringIncludes(html, 'class="hljs-comment">*/</span>');
  assertStringIncludes(html, 'class="hljs-keyword">const</span>');
  assertEquals((html.match(/data-part="line"/g) ?? []).length, 3);
  for (const number of [1, 2, 3]) assertStringIncludes(html, 'data-part="line-number">' + number);
  for (const variant of ['removed', 'added', 'highlighted']) {
    assertStringIncludes(html, 'data-line-variant="' + variant + '"');
  }
});

Deno.test('CodeBlock balances nested multiline syntax and groups fragments into caller rows', () => {
  const html = render(
    <CodeBlock
      lang='typescript'
      lines={[
        { text: '\x60hello ${\nNumber(42)' },
        { text: '} last\x60' },
      ]}
    />,
  );
  assertEquals((html.match(/data-part="line"/g) ?? []).length, 2);
  assertStringIncludes(html, 'class="hljs-subst">');
  assertStringIncludes(html, 'class="hljs-number">42</span>');
  assertStringIncludes(html, 'class="hljs-string">');
  assertEquals((html.match(/<span(?:\s|>)/g) ?? []).length, (html.match(/<\/span>/g) ?? []).length);
});

Deno.test('CodeBlock never treats explicit caller strings or Token content as highlighter HTML', () => {
  const html = render(
    <CodeBlock
      lang='typescript'
      lines={[
        { text: 'const source = 1;', content: '<b>Caller text</b>' },
        {
          text: 'const other = 2;',
          content: (
            <CodeBlock.Token type='keyword'>{'</span><script>alert(1)</script>'}</CodeBlock.Token>
          ),
        },
      ]}
    />,
  );
  assert(!html.includes('class="hljs-'));
  assert(!html.includes('<b>') && !html.includes('<script>'));
  assertStringIncludes(html, '&lt;b>Caller text&lt;/b>');
  assertStringIncludes(html, 'data-syntax="keyword"');
});

Deno.test('CodeBlock highlights each hidden file with its own explicit language', () => {
  const html = render(
    <CodeBlock
      lang='plaintext'
      tabs={[
        { value: 'data', label: 'data.json', lang: 'json', code: '{"ready":true}' },
        { value: 'source', label: 'source.ts', lang: 'typescript', code: 'const ready = true;' },
      ]}
    />,
  );
  assertStringIncludes(html, 'class="hljs-punctuation"');
  assertStringIncludes(html, 'class="hljs-keyword">const</span>');
  assertStringIncludes(html, 'data-clipboard="{&quot;ready&quot;:true}"');
});

Deno.test('CodeBlock preserves empty rows, raw CRLF copy text and hostile closing tags', () => {
  const source = 'const ready = true;\r\n\r\n';
  const html = render(<CodeBlock code={source} lang='typescript' />);
  assertEquals((html.match(/data-part="line"/g) ?? []).length, 3);
  assertStringIncludes(html, 'data-clipboard="' + source + '"');
  for (const lang of ['xml', 'typescript', 'unknown', undefined]) {
    const hostile = render(<CodeBlock code='</span><script>alert(1)</script>&amp;' lang={lang} />);
    assert(!hostile.includes('<script>') && !hostile.includes('<img '));
    assertStringIncludes(hostile, '&lt;');
  }
});
