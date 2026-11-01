import { Toc } from '../../registry/components/ui/toc.tsx';
import { AnchorNav } from '../../registry/components/ui/anchor-nav.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

/** Every declared Toc state is produced by either a preview or accepted root selection. */
export const docsNavigationFixtures: readonly ContractRenderFixture[] = [
  ...(['desktop', 'mobile'] as const).flatMap((breakpoint) =>
    (['2', '3'] as const).flatMap((level) =>
      (['rest', 'hover', 'current'] as const).map((state) => ({
        component: 'toc',
        scenario: breakpoint + '/' + level + '/' + state,
        props: [
          'breakpoint',
          'children',
          'links',
          'label',
          'currentId',
          'Item.href',
          'Item.children',
          'Item.level',
          'Item.state',
        ],
        parts: [
          'item',
          'links',
          ...(state === 'current' ? ['marker'] : []),
          ...(breakpoint === 'mobile' ? ['current', 'chevron-down'] : []),
        ],
        attributes: ['data-breakpoint', 'data-level', 'data-state'],
        render: () => (
          <Toc
            breakpoint={breakpoint}
            currentId={state === 'current' ? 'install' : null}
            links={<a href='#top'>Back to top</a>}
          >
            <Toc.Item href='#install' level={level} state={state === 'hover' ? 'hover' : 'rest'}>
              Installation
            </Toc.Item>
          </Toc>
        ),
      }))
    )
  ),
  ...(['rest', 'scrolled'] as const).map((state) => ({
    component: 'anchor-nav',
    scenario: state,
    props: ['children', 'state', 'currentId', 'Link.href', 'Link.children'],
    parts: ['anchor', 'marker'],
    attributes: ['data-state'],
    render: () => (
      <AnchorNav state={state} currentId='install'>
        <AnchorNav.Link href='#install'>Installation</AnchorNav.Link>
        <AnchorNav.Link href='#configure'>Configuration</AnchorNav.Link>
      </AnchorNav>
    ),
  })),
  {
    component: 'anchor-nav',
    scenario: 'observed-before-hydration',
    props: ['children', 'observe', 'defaultCurrentId', 'onCurrentChange', 'label'],
    parts: ['anchor'],
    attributes: ['data-state'],
    render: () => (
      <AnchorNav observe>
        <AnchorNav.Link href='#install'>Installation</AnchorNav.Link>
      </AnchorNav>
    ),
  },
];

/** These IDs also name real keypress cases in the browser suite. */
export const docsNavigationKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'toc',
    scenario: 'toc/native-links-and-disclosure',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Native links navigate hash; mobile details toggles and closed children leave the tab order.',
  },
  {
    component: 'anchor-nav',
    scenario: 'anchor-nav/native-links-and-current',
    keys: ['Tab', 'Shift+Tab', 'Enter'],
    expectation:
      'Native section links navigate and propose current without a tab key manager or passive hash mutation.',
  },
];
