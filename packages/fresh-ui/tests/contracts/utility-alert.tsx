import { Alert } from '../../registry/components/ui/alert.tsx';
import { Icon } from '../../primitives.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const alertFixtures: readonly ContractRenderFixture[] = [
  {
    component: 'icon',
    scenario: 'alert/bell',
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name='bell' />,
  },
  ...(['circle-check', 'circle-alert'] as const).map((name) => ({
    component: 'icon',
    scenario: `alert/${name}`,
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name={name} />,
  })),
  ...(['neutral', 'info', 'success', 'warning', 'destructive', 'important'] as const).flatMap((
    variant,
  ) =>
    (['subtle', 'strong'] as const).map((emphasis) => ({
      component: 'alert',
      scenario: `${variant}/${emphasis}`,
      props: [
        'variant',
        'emphasis',
        'icon',
        'title',
        'description',
        'action',
        'close',
        'closeLabel',
      ],
      parts: ['icon', 'body', 'title', 'description', 'actions', 'close'],
      attributes: ['data-variant', 'data-emphasis', 'data-state'],
      render: () => (
        <Alert
          variant={variant}
          emphasis={emphasis}
          title='Notice'
          description='Review changes'
          action={<a href='#review'>Review</a>}
          close
          closeLabel='Dismiss notice'
        />
      ),
    }))
  ),
  ...(['neutral', 'info', 'success', 'warning', 'destructive', 'important'] as const).map((
    variant,
  ) => ({
    component: 'alert',
    scenario: `default-label/${variant}`,
    props: ['variant'],
    parts: ['title'],
    render: () => <Alert variant={variant}>Body</Alert>,
  })),
  {
    component: 'alert',
    scenario: 'hidden-localized-label',
    props: ['title', 'toneLabel'],
    parts: ['title'],
    render: () => <Alert title={false} toneLabel='Hinweis'>Body</Alert>,
  },
  {
    component: 'alert',
    scenario: 'hidden-controlled',
    props: ['open', 'defaultOpen', 'onOpenChange', 'children', 'icon'],
    parts: ['description'],
    attributes: ['data-state'],
    render: () => (
      <Alert open={false} defaultOpen onOpenChange={() => {}} icon={false}>Hidden feedback</Alert>
    ),
  },
];

export const alertKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'alert',
    scenario: 'alert/native-actions-and-dismissal',
    keys: ['Tab/Shift+Tab', 'Enter/Space'],
    expectation:
      'Traverse action then close; native activation dismisses, hidden controls are skipped and controlled refusal stays open.',
  },
];
