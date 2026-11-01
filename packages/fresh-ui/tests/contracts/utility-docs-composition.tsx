import { RuledGrid } from '../../registry/components/ui/ruled-grid.tsx';
import { Hero } from '../../registry/components/ui/hero.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

/** Actual sources cover every settled axis and the normalized private Docs-card slots. */
export const docsCompositionFixtures: readonly ContractRenderFixture[] = [
  ...(['2', '3', '4'] as const).flatMap((columns) =>
    (['ruled', 'feature'] as const).map((variant) => ({
      component: 'ruled-grid',
      scenario: columns + '/' + variant,
      props: [
        'columns',
        'variant',
        'children',
        'Cell.eyebrow',
        'Cell.icon',
        'Cell.title',
        'Cell.children',
        'Cell.action',
      ],
      parts: ['grid', 'cell', 'card', 'eyebrow', 'icon', 'title', 'description', 'action', 'arrow'],
      attributes: ['data-columns', 'data-variant'],
      render: () => (
        <RuledGrid columns={columns} variant={variant}>
          <RuledGrid.Cell
            eyebrow='CONTRACT'
            icon='CLI'
            title={<a href='#contract'>The contract is the spine</a>}
            action={<button type='button'>Inspect contract</button>}
          >
            One public boundary.
          </RuledGrid.Cell>
        </RuledGrid>
      ),
    }))
  ),
  ...(['split', 'centered'] as const).flatMap((layout) =>
    (['desktop', 'mobile'] as const).map((breakpoint) => ({
      component: 'hero',
      scenario: layout + '/' + breakpoint,
      props: [
        'layout',
        'breakpoint',
        'eyebrow',
        'title',
        'headingLevel',
        'children',
        'actions',
        'aside',
        'paths',
      ],
      parts: ['layout', 'display', 'eyebrow', 'title', 'lede', 'actions', 'aside', 'path-stack'],
      attributes: ['data-layout', 'data-breakpoint'],
      render: () => (
        <Hero
          layout={layout}
          breakpoint={breakpoint}
          eyebrow='DENO META-FRAMEWORK'
          title='Define the public boundary once.'
          headingLevel='2'
          actions={<button type='button'>Start a workspace</button>}
          aside={<pre>deno task start</pre>}
          paths={<a href='#files'>You own every file</a>}
        >
          NetScript carries it through the stack.
        </Hero>
      ),
    }))
  ),
  {
    component: 'hero',
    scenario: 'automatic-minimal',
    props: ['title'],
    parts: ['layout', 'display', 'title'],
    attributes: ['data-layout'],
    render: () => <Hero title='Useful without hydration' />,
  },
  {
    component: 'ruled-grid',
    scenario: 'empty',
    props: [],
    parts: ['grid'],
    attributes: ['data-columns', 'data-variant'],
    render: () => <RuledGrid />,
  },
];

/** These IDs are real native keypress scenarios in the shared browser suite. */
export const docsCompositionKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'ruled-grid',
    scenario: 'ruled-grid/native-child-controls',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation: 'Visit and activate caller controls; grid/card frames add no stop or key manager.',
  },
  {
    component: 'hero',
    scenario: 'hero/native-actions-and-paths',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation: 'Native actions and aside links retain behavior in the same DOM at every width.',
  },
];
