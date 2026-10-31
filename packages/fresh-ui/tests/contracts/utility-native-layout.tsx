import { ScrollArea } from '../../registry/components/ui/scroll-area.tsx';
import { AspectRatio } from '../../registry/components/ui/aspect-ratio.tsx';
import { Direction } from '../../registry/components/ui/direction.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const nativeLayoutFixtures: readonly ContractRenderFixture[] = [
  ...(['vertical', 'horizontal', 'both'] as const).map((orientation) => ({
    component: 'scroll-area',
    scenario: `native/${orientation}`,
    props: ['label', 'orientation', 'children'],
    parts: ['viewport'],
    attributes: ['data-orientation'],
    render: () => (
      <ScrollArea label='Recent activity' orientation={orientation}>
        <a href='#activity'>Open activity</a>
      </ScrollArea>
    ),
  })),
  ...(['16:9', '4:3', '1:1', '21:9'] as const).map((ratio) => ({
    component: 'aspect-ratio',
    scenario: `media/${ratio}`,
    props: ['ratio', 'children'],
    parts: ['media'],
    attributes: ['data-ratio'],
    render: () => (
      <AspectRatio ratio={ratio}>
        <button type='button'>Play</button>
      </AspectRatio>
    ),
  })),
  ...(['ltr', 'rtl'] as const).map((dir) => ({
    component: 'direction',
    scenario: `boundary/${dir}`,
    props: ['as', 'dir', 'children'],
    attributes: ['data-dir'],
    render: () => (
      <Direction as='section' dir={dir}>
        <input aria-label='Search' />
      </Direction>
    ),
  })),
];

export const nativeLayoutKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'scroll-area',
    scenario: 'scroll-area/native-keyboard-scroll',
    keys: ['Tab', 'ArrowDown', 'PageDown', 'Home', 'End', 'ArrowRight', 'ArrowLeft'],
    expectation:
      'The named native viewport scrolls on its allowed axes and preserves child Tab order.',
  },
  {
    component: 'aspect-ratio',
    scenario: 'aspect-ratio/native-child-focus',
    keys: ['Tab', 'Shift+Tab', 'Enter'],
    expectation:
      'The frame adds no tab stop; native media child controls receive focus and activate.',
  },
  {
    component: 'direction',
    scenario: 'direction/local-rtl-keyboard',
    keys: ['ArrowLeft', 'ArrowRight', 'Tab'],
    expectation:
      'Local native dir reverses descendant horizontal roving keys without a document mutation.',
  },
];
