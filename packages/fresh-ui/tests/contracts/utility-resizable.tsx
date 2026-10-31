import { Resizable } from '../../registry/components/ui/resizable.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const resizableFixtures: readonly ContractRenderFixture[] =
  (['horizontal', 'vertical'] as const).flatMap((direction) =>
    [true, false].map((grip) => ({
      component: 'resizable',
      scenario: `${direction}/${grip ? 'grip' : 'plain'}`,
      props: ['label', 'direction', 'grip', 'startContent', 'endContent'],
      parts: grip ? ['grip'] : [],
      attributes: ['data-direction'],
      render: () => (
        <Resizable
          label='Contents'
          direction={direction}
          grip={grip}
          startContent={<button type='button'>Open chapter</button>}
          endContent={<a href='#chapter'>Read chapter</a>}
        />
      ),
    }))
  );

export const resizableKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'resizable',
  scenario: 'resizable/bounded-native-keyboard',
  keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab/Shift+Tab'],
  expectation:
    'The measured separator resizes within real bounds, respects RTL/controlled refusal and preserves native child focus.',
}];
