import { CommandPalette } from '../../registry/components/ui/command-palette.tsx';
import { Icon } from '../../primitives.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const commandPaletteFixtures: readonly ContractRenderFixture[] = [
  {
    component: 'icon',
    scenario: 'command/corner-down-left',
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name='corner-down-left' />,
  },
  {
    component: 'icon',
    scenario: 'command/file-text',
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name='file-text' />,
  },
  ...[true, false].flatMap((scrim) =>
    [false, true].map((loading) => ({
      component: 'command-palette',
      scenario: `${scrim}/${loading}`,
      props: [
        'open',
        'onOpenChange',
        'groups',
        'scrim',
        'loading',
        'loadingLabel',
        'searchLabel',
        'dialogLabel',
        'onQueryChange',
        'filters',
        'footer',
      ],
      attributes: ['data-content', 'data-scrim'],
      parts: [
        'content',
        'input-row',
        'search-icon',
        'input',
        'kbd',
        'list',
        'filters',
        'footer',
        ...(scrim ? ['backdrop'] : []),
        ...(loading ? ['loading'] : [
          'group',
          'group-label',
          'item',
          'item-copy',
          'item-label',
          'item-url',
          'item-excerpt',
          'item-shortcut',
          'item-kind',
          'item-hash',
          'item-return',
          'item-icon',
        ]),
      ],
      render: () => (
        <CommandPalette
          open
          scrim={scrim}
          loading={loading}
          onOpenChange={() => {}}
          onQueryChange={() => {}}
          searchLabel='Find commands'
          dialogLabel='Commands'
          loadingLabel='Please wait'
          filters={<button type='button'>All</button>}
          footer='Keyboard help'
          groups={[{
            id: 'docs',
            label: 'Docs',
            items: [{
              id: 'guide /α',
              label: 'Guide',
              type: 'section',
              url: '/guide',
              excerpt: 'Read the guide',
              shortcut: '⌘G',
              kind: 'Guide',
              hash: '#guide',
            }, { id: 'disabled', label: 'Disabled', disabled: true }],
          }]}
        />
      ),
    }))
  ),
  {
    component: 'command-palette',
    scenario: 'inline-empty',
    props: ['scrim', 'groups', 'emptyLabel'],
    parts: ['empty'],
    attributes: ['data-content'],
    render: () => <CommandPalette scrim={false} groups={[]} emptyLabel='Nothing here' />,
  },
];
export const commandPaletteKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'command-palette',
  scenario: 'command-palette/keyboard-and-controlled-refusal',
  keys: ['ArrowDown/ArrowUp', 'Home/End', 'Enter', 'Escape', 'Tab/Shift+Tab'],
  expectation:
    'Enabled matches activate once via pointer or Enter; disabled results are skipped, empty/loading and IME cannot activate, modal refusal retains focus and inline mode preserves native traversal.',
}];
