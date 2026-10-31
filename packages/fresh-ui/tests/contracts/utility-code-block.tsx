import { CodeBlock } from '../../registry/components/ui/code-block.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

const lines = [
  { text: 'original', variant: 'default' as const },
  { text: 'previous', variant: 'removed' as const },
  { text: 'current', variant: 'added' as const },
  { text: 'highlight', variant: 'highlighted' as const },
];
const tabs = [
  { value: 'one', label: 'one.ts', code: 'const one = 1;', lang: 'ts' },
  { value: 'src/two file.ts', label: 'two.ts', lines },
];

export const codeBlockFixtures: readonly ContractRenderFixture[] = [
  ...(['single', 'tabbed', 'diff'] as const).flatMap((variant) =>
    (['md', 'sm'] as const).flatMap((size) =>
      (['default', 'destructive'] as const).map((tone) => ({
        component: 'code-block',
        scenario: `${variant}/${size}/${tone}`,
        props: [
          'code',
          'filename',
          'lang',
          'variant',
          'size',
          'tone',
          'tabs',
          'lines',
          'lineNumbers',
          'footer',
        ],
        parts: [
          'head',
          'copy',
          'content',
          'line',
          'line-number',
          'sign',
          'code',
          'footer',
          'status',
          ...(variant === 'tabbed' ? ['tabs', 'tab'] : ['name', 'lang']),
          ...(variant === 'diff' ? ['added-count', 'removed-count'] : []),
        ],
        attributes: [
          'data-variant',
          'data-tone',
          'data-size',
          'data-header',
          'data-state',
          'data-scrollbar',
          'data-line-variant',
        ],
        render: () => (
          <CodeBlock
            variant={variant}
            size={size}
            tone={tone}
            filename='source.ts'
            lang='ts'
            code='const answer = 42;'
            tabs={tabs}
            lines={variant === 'diff' ? lines : undefined}
            lineNumbers
            footer
          />
        ),
      }))
    )
  ),
  ...[false, true].map((enabled) => ({
    component: 'code-block',
    scenario: `optional-parts/${enabled}`,
    props: [
      'header',
      'copy',
      'lineNumbers',
      'footer',
      'scrollbar',
      'footerContent',
      'state',
      'lines',
    ],
    parts: [
      'line',
      'syntax',
      'status',
      ...(enabled ? ['head', 'copy', 'line-number', 'footer'] : []),
    ],
    attributes: ['data-scrollbar', 'data-state', 'data-syntax'],
    render: () => (
      <CodeBlock
        header={enabled}
        copy={enabled}
        lineNumbers={enabled}
        footer={enabled}
        scrollbar={enabled}
        state={enabled ? 'copied' : 'rest'}
        footerContent='Custom footer'
        lines={[{
          text: 'raw',
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
                <CodeBlock.Token key={type} type={type}>{type}</CodeBlock.Token>
              ))}
            </>
          ),
        }]}
      />
    ),
  })),
  {
    component: 'code-block',
    scenario: 'tabbed-without-chrome',
    props: ['tabs', 'header', 'defaultValue', 'value', 'onValueChange', 'onCopied', 'onCopyError'],
    parts: ['tabs', 'tab', 'content', 'line', 'status'],
    render: () => (
      <CodeBlock
        tabs={tabs}
        header={false}
        value='src/two file.ts'
        defaultValue='one'
        onValueChange={() => {}}
        onCopied={() => {}}
        onCopyError={() => {}}
      />
    ),
  },
];

export const codeBlockKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'code-block',
    scenario: 'code-block/tabs-and-rtl',
    keys: ['Tab/Shift+Tab', 'ArrowLeft/ArrowRight', 'Home/End', 'Enter/Space'],
    expectation:
      'File tabs preserve ARIA relationships, roving focus and controlled refusal in both directions.',
  },
  {
    component: 'code-block',
    scenario: 'code-block/clipboard-and-native-scroll',
    keys: ['Tab/Shift+Tab', 'Enter/Space', 'ArrowLeft/ArrowRight'],
    expectation:
      'Native copy button writes current raw text; focused code retains horizontal arrow scrolling.',
  },
];
