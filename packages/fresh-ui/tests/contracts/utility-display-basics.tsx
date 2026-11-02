import { Item } from '../../registry/components/ui/item.tsx';
import { Kbd } from '../../registry/components/ui/kbd.tsx';
import { Collapsible } from '../../registry/components/ui/collapsible.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const displayBasicFixtures: readonly ContractRenderFixture[] = [
  ...(['default', 'outline', 'muted'] as const).flatMap((variant) =>
    (['default', 'sm', 'xs'] as const).map((size) => ({
      component: 'item',
      scenario: `${variant}/${size}`,
      props: [
        'title',
        'description',
        'media',
        'actions',
        'header',
        'footer',
        'chevron',
        'variant',
        'size',
        'children',
      ],
      parts: ['media', 'content', 'title', 'description', 'actions', 'header', 'footer', 'chevron'],
      attributes: ['data-variant', 'data-size'],
      render: () => (
        <Item
          title={<a href='#item'>Order42</a>}
          description='Ready for review'
          media={<span aria-hidden='true'>▣</span>}
          actions={<button type='button'>Review order</button>}
          header='Recent order'
          footer='Updated today'
          chevron
          variant={variant}
          size={size}
        >
          <span>Additional content</span>
        </Item>
      ),
    }))
  ),
  ...(['sm', 'md'] as const).flatMap((size) =>
    (['default', 'inverse'] as const).map((variant) => ({
      component: 'kbd',
      scenario: `${size}/${variant}`,
      props: ['children', 'size', 'variant'],
      parts: ['label'],
      attributes: ['data-size', 'data-variant'],
      render: () => <Kbd size={size} variant={variant}>Enter</Kbd>,
    }))
  ),
  ...[false, true].flatMap((open) =>
    [false, true].map((disabled) => ({
      component: 'collapsible',
      scenario: `${open}/${disabled}`,
      props: ['label', 'children', 'open', 'disabled'],
      parts: ['trigger', 'label', 'indicator', 'content'],
      attributes: ['data-open', 'data-state'],
      render: () => (
        <Collapsible label='Repository details' open={open} disabled={disabled}>
          <a href='#repository'>Open repository</a>
        </Collapsible>
      ),
    }))
  ),
];

export const displayBasicKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'item',
    scenario: 'native-child-controls',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Native links and actions retain order and activation; presentation adds no focus stop.',
  },
  {
    component: 'kbd',
    scenario: 'noninteractive-notation',
    keys: ['Tab'],
    expectation: 'Key notation adds no focus target or keyboard behavior.',
  },
  {
    component: 'collapsible',
    scenario: 'native-disclosure',
    keys: ['Enter', 'Space', 'Tab', 'Shift+Tab'],
    expectation:
      'Summary toggles; hidden content leaves tab order; disabled is inert and controlled refusal holds.',
  },
];
