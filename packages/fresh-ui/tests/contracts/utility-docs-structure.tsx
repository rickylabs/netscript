import { FilePathChip } from '../../registry/components/ui/file-path-chip.tsx';
import { AttributeChip } from '../../registry/components/ui/attribute-chip.tsx';
import { FileTree } from '../../registry/components/ui/file-tree.tsx';
import { Figure } from '../../registry/components/ui/figure.tsx';
import { Icon } from '../../primitives.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const docsStructureFixtures: readonly ContractRenderFixture[] = [
  {
    component: 'icon',
    scenario: 'folder',
    props: ['name', 'size'],
    parts: ['glyph'],
    render: () => <Icon name='folder' size={14} />,
  },
  ...[false, true].map((copy) => ({
    component: 'file-path-chip',
    scenario: 'copy-' + copy,
    props: ['path', 'copy', 'copyLabel', 'copiedLabel', 'errorLabel'],
    parts: copy ? ['copy'] : [],
    attributes: ['data-state'],
    render: () => <FilePathChip path='apps/dashboard/components/ui/' copy={copy} />,
  })),
  ...(['sm', 'md'] as const).map((size) => ({
    component: 'attribute-chip',
    scenario: size,
    props: ['name', 'value', 'size'],
    attributes: ['data-size'],
    render: () => <AttributeChip name='data-variant' value='primary' size={size} />,
  })),
  ...(['folder', 'file'] as const).flatMap((type) =>
    (['none', 'owned', 'generated', 'guidance'] as const).flatMap((ownership) =>
      [false, true].map((tag) => ({
        component: 'file-tree',
        scenario: type + '/' + ownership + '/tag-' + tag,
        props: [
          'items',
          'label',
          'tag',
          'typeLabels',
          'Entry.id',
          'Entry.type',
          'Entry.name',
          'Entry.comment',
          'Entry.ownership',
          'Entry.tag',
          'Entry.children',
        ],
        parts: [
          'node',
          'row',
          'icon',
          'name',
          'comment',
          'type-label',
          ...(ownership === 'none' ? [] : ['tag']),
        ],
        attributes: ['data-type', 'data-ownership'],
        render: () => (
          <FileTree
            label='Scaffold files'
            tag={tag}
            typeLabels={{ folder: 'Directory', file: 'Document' }}
            items={[
              type === 'folder'
                ? {
                  id: 'routes',
                  type,
                  name: <a href='#routes'>routes/</a>,
                  comment: '# Fresh pages',
                  ownership,
                  children: [{ id: 'routes/index.tsx', type: 'file', name: 'index.tsx' }],
                }
                : {
                  id: 'deno.json',
                  type,
                  name: <a href='#config'>deno.json</a>,
                  comment: '# Workspace configuration',
                  ownership,
                },
            ]}
          />
        ),
      }))
    )
  ),
  ...(['prose', 'wide'] as const).flatMap((width) =>
    (['image', 'diagram'] as const).map((media) => ({
      component: 'figure',
      scenario: width + '/' + media,
      props: ['children', 'caption', 'width', 'media'],
      parts: ['caption'],
      attributes: ['data-width', 'data-media'],
      render: () => (
        <Figure width={width} media={media} caption={<a href='#figure-source'>Read source</a>}>
          {media === 'image'
            ? <img src='preview.svg' alt='Project structure' width={320} height={160} />
            : (
              <svg viewBox='0 0 320 160' role='img' aria-label='Project flow'>
                <path d='M0 80H320' />
              </svg>
            )}
          <button type='button'>Inspect figure</button>
        </Figure>
      ),
    }))
  ),
];
export const docsStructureKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'file-path-chip',
    scenario: 'file-path-chip/native-copy-outcomes',
    keys: ['Tab', 'Enter', 'Space'],
    expectation:
      'Native copy activation reports actual exact clipboard success/error, ignores stale completion and retains focus.',
  },
  {
    component: 'attribute-chip',
    scenario: 'attribute-chip/native-tab-skip',
    keys: ['Tab', 'Shift+Tab'],
    expectation: 'Escaped text adds no tab stop or DOM attribute mutation.',
  },
  {
    component: 'file-tree',
    scenario: 'file-tree/native-list-child-focus',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'ArrowLeft', 'ArrowRight'],
    expectation:
      'Read-only native lists retain supplied child links without tree selection, collapse or roving keys.',
  },
  {
    component: 'figure',
    scenario: 'figure/native-media-controls',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation: 'Native figure adds no tab stop and preserves caller media/link/button controls.',
  },
];
