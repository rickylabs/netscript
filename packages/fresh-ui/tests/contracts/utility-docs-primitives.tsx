import { Label } from '../../registry/components/ui/label.tsx';
import { Card } from '../../registry/components/ui/card.tsx';
import { Pagination } from '../../registry/components/ui/pagination.tsx';
import { Icon } from '../../primitives.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const docsPrimitiveFixtures: readonly ContractRenderFixture[] = [
  ...(['arrow-left', 'arrow-right'] as const).map((name) => ({
    component: 'icon',
    scenario: `pager/${name}`,
    props: ['name'],
    parts: ['glyph'],
    render: () => <Icon name={name} />,
  })),
  ...(['default', 'eyebrow'] as const).flatMap((variant) =>
    (['rest', 'disabled', 'invalid'] as const).flatMap((state) =>
      [false, true].flatMap((required) =>
        [false, true].map((optional) => ({
          component: 'label',
          scenario: `${variant}/${state}/${required}/${optional}`,
          props: ['children', 'variant', 'state', 'required', 'optional', 'optionalText'],
          parts: ['text', ...(optional && !required ? ['optional-hint'] : [])],
          attributes: ['data-variant', 'data-state', 'data-sr-only'],
          render: () => (
            <Label
              variant={variant}
              state={state}
              required={required}
              optional={optional}
              optionalText='(optional)'
            >
              Email
            </Label>
          ),
        }))
      )
    )
  ),
  {
    component: 'label',
    scenario: 'sr-only',
    props: ['children', 'srOnly', 'required'],
    attributes: ['data-sr-only'],
    render: () => <Label srOnly required>Email</Label>,
  },
  ...(['default', 'rule'] as const).flatMap((variant) =>
    (['md', 'sm'] as const).flatMap((size) =>
      (['rest', 'hover', 'focus', 'selected'] as const).flatMap((state) =>
        [false, true].map((interactive) => ({
          component: 'card',
          scenario: `${variant}/${size}/${state}/${interactive}`,
          props: ['children', 'variant', 'size', 'state', 'interactive'],
          parts: ['header', 'title', 'description', 'action', 'body', 'footer'],
          attributes: ['data-variant', 'data-size', 'data-state'],
          render: () => (
            <Card variant={variant} size={size} state={state} interactive={interactive}>
              <Card.Header>
                <Card.Title>Order</Card.Title>
                <Card.Description>Shipping details</Card.Description>
                <Card.Action>
                  <a href='#order'>Review</a>
                </Card.Action>
              </Card.Header>
              <Card.Body>Order summary</Card.Body>
              <Card.Footer>Updated today</Card.Footer>
            </Card>
          ),
        }))
      )
    )
  ),
  ...(['page', 'previous', 'next'] as const).flatMap((type) =>
    (['rest', 'hover', 'focus', 'current', 'disabled'] as const).map((state) => ({
      component: 'pagination',
      scenario: `key/${type}/${state}`,
      props: ['children', 'variant', 'type', 'state', 'href', 'current', 'disabled'],
      parts: ['meta', 'actions', 'key', 'ellipsis', ...(type !== 'page' ? ['icon'] : [])],
      attributes: ['data-variant', 'data-type', 'data-state'],
      render: () => (
        <Pagination variant='numbered'>
          <Pagination.Meta>1–20 of 80</Pagination.Meta>
          <Pagination.Actions>
            <Pagination.Link
              href='#page'
              type={type}
              state={state}
              current={state === 'current'}
              disabled={state === 'disabled'}
            >
              {type === 'page' ? '1' : undefined}
            </Pagination.Link>
            <Pagination.Ellipsis />
          </Pagination.Actions>
        </Pagination>
      ),
    }))
  ),
  ...(['rest', 'hover', 'focus', 'disabled'] as const).map((state) => ({
    component: 'pagination',
    scenario: `pager/${state}`,
    props: ['children', 'variant', 'state', 'href'],
    parts: ['previous', 'next', 'direction', 'title', 'icon'],
    attributes: ['data-variant', 'data-type', 'data-state'],
    render: () => (
      <Pagination variant='pager'>
        <Pagination.Previous href='#before' state={state}>Before</Pagination.Previous>
        <Pagination.Next href='#after' state={state}>After</Pagination.Next>
      </Pagination>
    ),
  })),
];

export const docsPrimitiveKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'label',
    scenario: 'docs-label/native-association',
    keys: ['Tab/Shift+Tab'],
    expectation: 'Labels preserve native input association and add no tab stops, including srOnly.',
  },
  {
    component: 'card',
    scenario: 'docs-card/native-child-controls',
    keys: ['Tab/Shift+Tab'],
    expectation:
      'Only native child links/buttons receive keyboard focus; the container remains presentational.',
  },
  {
    component: 'pagination',
    scenario: 'pagination/native-links-and-disabled',
    keys: ['Tab/Shift+Tab', 'Enter'],
    expectation:
      'Enabled links follow destinations; disabled links and ellipses are skipped and cannot activate.',
  },
];
