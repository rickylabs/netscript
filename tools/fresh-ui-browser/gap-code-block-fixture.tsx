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
    </>
  );
}
