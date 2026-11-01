import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import {
  CodeBlock,
  type CodeLineVariant,
  type CodeSyntax,
} from '../../packages/fresh-ui/registry/components/ui/code-block.tsx';

export function CodeBlocks() {
  const [copied, setCopied] = useState(''), [errors, setErrors] = useState(0);
  const [requested, setRequested] = useState(''),
    [nativeCopies, setNativeCopies] = useState(0);
  const highlightedComment = '// highlighted';
  const syntax: readonly CodeSyntax[] = [
    'keyword',
    'function',
    'type',
    'string',
    'number',
    'comment',
    'punctuation',
  ];
  const rowVariants: readonly CodeLineVariant[] = ['default', 'added', 'removed', 'highlighted'];
  const files = [
    {
      value: 'one',
      label: 'one.ts',
      lang: 'TypeScript',
      code: 'const first = "<one>";\n' + 'long-source '.repeat(60),
    },
    {
      value: 'src/second file.ts',
      label: 'second.ts',
      lang: 'TypeScript',
      code: 'export const second = 2;\n',
    },
    { value: 'readme', label: 'README.md', lang: 'Markdown', code: '# Notes' },
  ];
  return (
    <>
      <h2>CodeBlock components</h2>
      <section id='code-files' aria-label='Tabbed source example'>
        <CodeBlock
          aria-label='Project source'
          tabs={files}
          lineNumbers
          footer
          onCopied={setCopied}
          onCopyError={() => setErrors((n) => n + 1)}
          onCopy={() => setNativeCopies((n) => n + 1)}
        />
        <output aria-label='Copied source'>{copied}</output>
        <output aria-label='Copy errors'>{errors}</output>
        <output aria-label='Native copy events'>{nativeCopies}</output>
      </section>
      <section id='code-controlled' aria-label='Controlled source example'>
        <CodeBlock
          aria-label='Controlled source'
          tabs={files}
          value='one'
          onValueChange={setRequested}
          size='sm'
        />
        <output aria-label='Requested file'>{requested}</output>
      </section>
      <section id='code-chromeless' aria-label='Source without optional chrome'>
        <CodeBlock
          aria-label='Minimal source'
          tabs={files.slice(0, 2)}
          header={false}
          copy={false}
          scrollbar={false}
        />
      </section>
      <section id='code-diff' aria-label='Source diff example'>
        <CodeBlock
          aria-label='Source changes'
          variant='diff'
          filename='changes.ts'
          lang='TypeScript'
          footer
          lineNumbers
          lines={[
            { text: 'const previous = 1;', variant: 'removed' },
            {
              text: 'const current = 2;',
              variant: 'added',
              content: (
                <>
                  <CodeBlock.Token type='keyword'>const</CodeBlock.Token>{' '}
                  <CodeBlock.Token type='function'>current</CodeBlock.Token>
                  {' = '}
                  <CodeBlock.Token type='number'>2</CodeBlock.Token>
                  <CodeBlock.Token type='punctuation'>;</CodeBlock.Token>
                </>
              ),
            },
            {
              text: 'type Name = "example";',
              variant: 'highlighted',
              content: (
                <>
                  <CodeBlock.Token type='type'>Name</CodeBlock.Token>
                  {' = '}
                  <CodeBlock.Token type='string'>"example"</CodeBlock.Token>{' '}
                  <CodeBlock.Token type='comment'>
                    {highlightedComment}
                  </CodeBlock.Token>
                </>
              ),
            },
            {
              text: 'syntax reference',
              content: (
                <>
                  {([
                    'keyword',
                    'function',
                    'type',
                    'string',
                    'number',
                    'comment',
                    'punctuation',
                  ] as const).map((type) => (
                    <CodeBlock.Token key={type} type={type}>
                      {`${type} `}
                    </CodeBlock.Token>
                  ))}
                </>
              ),
            },
            { text: '' },
          ]}
        />
      </section>
      <section id='code-syntax-contrast' aria-label='Syntax on every code surface'>
        <CodeBlock
          aria-label='Syntax contrast matrix'
          filename='syntax.ts'
          variant='diff'
          copy={false}
          lines={rowVariants.map((variant) => ({
            variant,
            text: syntax.join(' '),
            content: syntax.map((type) => (
              <CodeBlock.Token key={type} type={type}>{`${type} `}</CodeBlock.Token>
            )),
          }))}
        />
      </section>
      <section id='code-single' aria-label='Single source example'>
        <CodeBlock
          aria-label='Single source'
          filename='command.sh'
          header='tabs'
          lang='Shell'
          code='deno task test'
          size='sm'
          tone='destructive'
          footer
          footerContent='Run from the repository root'
        />
      </section>
      <AutomaticCodeExamples />
    </>
  );
}

function AutomaticCodeExamples() {
  const unknownSource = '<div>Literal &amp; text</div>';
  const [extra, setExtra] = useState(false);
  const [known, setKnown] = useState(true);
  const [copied, setCopied] = useState('');
  const source = [
    '/* open',
    'const hidden = 42;',
    '*/ const visible = "</span><script>safe</script>&amp;";',
    '',
  ].join('\r\n');
  const files = [
    { value: 'typed', label: 'automatic.ts', lang: 'typescript', code: source },
    {
      value: 'json',
      label: 'automatic.json',
      lang: known ? 'json' : 'unknown-language',
      code: '{"ready":true}',
    },
    ...(extra
      ? [{
        value: 'xml',
        label: 'automatic.xml',
        lang: 'xml',
        code: '<article>Read &amp; write</article>',
      }]
      : []),
  ];
  return (
    <>
      <section id='code-automatic' aria-label='Automatic syntax behavior'>
        <CodeBlock aria-label='Automatic source' tabs={files} lineNumbers onCopied={setCopied} />
        <Button type='button' onClick={() => setExtra(!extra)}>
          {extra ? 'Remove extra language file' : 'Add extra language file'}
        </Button>
        <Button type='button' onClick={() => setKnown(!known)}>
          Toggle JSON language recognition
        </Button>
        <output aria-label='Automatic transfer'>{copied}</output>
        <CodeBlock
          aria-label='Explicit source'
          lang='typescript'
          header={false}
          copy={false}
          lines={[
            { text: 'const ignored = 1;', content: '<b>Caller literal</b>' },
            {
              text: 'const other = 2;',
              content: <CodeBlock.Token type='keyword'>{'<em>Explicit token</em>'}
              </CodeBlock.Token>,
            },
          ]}
        />
        <CodeBlock
          aria-label='Unknown source'
          lang='unknown-language'
          header={false}
          copy={false}
          code={unknownSource}
        />
        <CodeBlock
          aria-label='Nested syntax source'
          lang='typescript'
          header={false}
          copy={false}
          lines={[
            { text: '\x60hello ${\nNumber(42)' },
            { text: '} last\x60' },
          ]}
        />
      </section>
      <section id='code-automatic-contrast' aria-label='Automatic syntax on every code surface'>
        {(['default', 'added', 'removed', 'highlighted'] as const).flatMap((variant) => [
          <CodeBlock
            key={'ts' + variant}
            aria-label={'Automatic TypeScript ' + variant}
            lang='typescript'
            header={false}
            copy={false}
            lines={[{
              variant,
              text: 'function greet(value: string) { return "hello" + String(42); } // note',
            }]}
          />,
          <CodeBlock
            key={'json' + variant}
            aria-label={'Automatic JSON ' + variant}
            lang='json'
            header={false}
            copy={false}
            lines={[{ variant, text: '{"message":"hello","count":42}' }]}
          />,
        ])}
      </section>
    </>
  );
}
