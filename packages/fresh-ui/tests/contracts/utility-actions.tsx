import { Button } from '../../registry/components/ui/button.tsx';
import { ButtonGroup } from '../../registry/components/ui/button-group.tsx';
import { Toggle } from '../../registry/components/ui/toggle.tsx';
import { ToggleGroup } from '../../registry/components/ui/toggle-group.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

const items = [{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, {
  value: 'closed',
  label: 'Closed',
  disabled: true,
}];

export const actionFixtures: readonly ContractRenderFixture[] = [
  ...(['horizontal', 'vertical'] as const).flatMap((orientation) =>
    (['sm', 'md', 'lg'] as const).map((size) => ({
      component: 'button-group',
      scenario: `${orientation}/${size}`,
      props: ['children', 'orientation', 'size', 'separator', 'text', 'textContent'],
      parts: ['text', 'separator'],
      attributes: ['data-size', 'data-orientation'],
      render: () => (
        <ButtonGroup orientation={orientation} size={size} separator textContent='Actions'>
          <Button>Save</Button>
          <Button>Cancel</Button>
        </ButtonGroup>
      ),
    }))
  ),
  ...(['default', 'outline'] as const).flatMap((variant) =>
    (['sm', 'md', 'lg'] as const).map((size) => ({
      component: 'toggle',
      scenario: `${variant}/${size}`,
      props: ['variant', 'size', 'selected', 'children', 'iconStartGlyph', 'iconEndGlyph'],
      parts: ['label', 'icon-start', 'icon-end'],
      attributes: ['data-size', 'data-variant', 'data-selected', 'data-state'],
      render: () => (
        <Toggle variant={variant} size={size} selected iconStartGlyph='★' iconEndGlyph='⌄'>
          Bold
        </Toggle>
      ),
    }))
  ),
  {
    component: 'toggle',
    scenario: 'disabled',
    props: ['disabled', 'children'],
    attributes: ['data-state'],
    render: () => <Toggle disabled>Unavailable</Toggle>,
  },
  ...(['default', 'outline', 'segmented'] as const).flatMap((variant) =>
    (['horizontal', 'vertical'] as const).map((orientation) => ({
      component: 'toggle-group',
      scenario: `${variant}/${orientation}`,
      props: ['label', 'items', 'variant', 'orientation', 'defaultValue'],
      parts: variant === 'segmented' ? ['track'] : [],
      attributes: ['data-size', 'data-variant', 'data-orientation', 'data-type'],
      render: () => (
        <ToggleGroup
          label='Filter'
          items={items}
          variant={variant}
          orientation={orientation}
          defaultValue={['all']}
        />
      ),
    }))
  ),
];

/** The matching Playwright assertions live in gap-tests/actions.spec.ts. */
export const actionKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'button-group',
    scenario: 'native-tab-order',
    keys: ['Tab', 'Shift+Tab', 'Enter'],
    expectation: 'Native child actions retain tab order and activation.',
  },
  {
    component: 'toggle',
    scenario: 'native-press',
    keys: ['Enter', 'Space'],
    expectation: 'Each activation updates aria-pressed and data-selected; disabled is inert.',
  },
  {
    component: 'toggle-group',
    scenario: 'roving-selection',
    keys: ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', 'Space'],
    expectation: 'Focus wraps past disabled items; activation follows single/multiple mode.',
  },
];
