import { PageHeader } from '../../registry/components/ui/page-header.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const pageHeaderFixtures: readonly ContractRenderFixture[] = [
  ...(['default', 'with-tabs', 'with-status'] as const).map((variant) => ({
    component: 'page-header',
    scenario: `declarative/${variant}`,
    props: [
      'variant',
      'title',
      'eyebrow',
      'description',
      'breadcrumb',
      'actions',
      'tabs',
      'status',
    ],
    parts: [
      'layout',
      'main',
      'intro',
      'title',
      'eyebrow',
      'description',
      'breadcrumb',
      'actions',
      'tabs',
      'status-bar',
    ],
    attributes: ['data-variant'],
    render: () => (
      <PageHeader
        variant={variant}
        title='Overview'
        eyebrow='Commerce'
        description='Recent orders'
        breadcrumb={<a href='#workspace'>Workspace</a>}
        actions={<button type='button'>Create order</button>}
        tabs={
          <nav aria-label='Overview sections'>
            <a href='#orders'>Orders</a>
          </nav>
        }
        status='Operational'
      />
    ),
  })),
  {
    component: 'page-header',
    scenario: 'title-only',
    props: ['title'],
    parts: ['title'],
    render: () => <PageHeader title='Settings' />,
  },
];

export const pageHeaderKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'page-header',
  scenario: 'page-header/native-child-controls',
  keys: ['Tab/Shift+Tab'],
  expectation:
    'Only child links/buttons receive focus, in source order; the header adds no tab stop.',
}];
