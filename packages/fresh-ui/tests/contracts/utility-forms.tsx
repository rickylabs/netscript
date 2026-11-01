import { RadioGroup } from '../../registry/components/ui/radio-group.tsx';
import { InputGroup } from '../../registry/components/ui/input-group.tsx';
import { InputOTP } from '../../registry/components/ui/input-otp.tsx';
import { Slider } from '../../registry/components/ui/slider.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const formFixtures: readonly ContractRenderFixture[] = [
  ...(['vertical', 'horizontal'] as const).map((orientation) => ({
    component: 'radio-group',
    scenario: orientation,
    props: ['name', 'legend', 'options', 'defaultValue', 'orientation'],
    parts: ['control', 'indicator', 'body', 'label', 'description'],
    attributes: ['data-orientation', 'data-state', 'data-checked'],
    render: () => (
      <RadioGroup
        name='plan'
        legend='Plan'
        orientation={orientation}
        defaultValue='free'
        options={[{ value: 'free', label: 'Free', description: 'Entry tier' }, {
          value: 'pro',
          label: 'Pro',
        }]}
      />
    ),
  })),
  ...(['inline-start', 'inline-end', 'block-start', 'block-end'] as const).map((align) => ({
    component: 'input-group',
    scenario: align,
    props: ['control', 'addon', 'text', 'align'],
    parts: ['addon', 'control', 'text'],
    attributes: ['data-align', 'data-state'],
    render: () => (
      <InputGroup
        aria-label='Search field'
        align={align}
        control={<input aria-label='Search' />}
        addon='⌕'
        text='Search'
      />
    ),
  })),
  ...([4, 6] as const).flatMap((length) =>
    ([1, 2] as const).map((groups) => ({
      component: 'input-otp',
      scenario: `${length}/${groups}`,
      props: ['label', 'length', 'groups', 'defaultValue'],
      parts: groups === 2 ? ['group', 'slot', 'separator'] : ['group', 'slot'],
      attributes: ['data-length', 'data-groups', 'data-content', 'data-state'],
      render: () => <InputOTP label='Code' length={length} groups={groups} defaultValue='12' />,
    }))
  ),
  ...(['horizontal', 'vertical'] as const).flatMap((orientation) =>
    ([1, 2] as const).map((thumbs) => ({
      component: 'slider',
      scenario: `${orientation}/${thumbs}`,
      props: ['label', 'orientation', 'thumbs', 'value', 'defaultValues'],
      parts: ['track', 'range', 'thumb', 'value-label'],
      attributes: ['data-orientation', 'data-thumbs', 'data-state'],
      render: () => (
        <Slider
          label='Volume'
          orientation={orientation}
          thumbs={thumbs}
          value
          defaultValues={thumbs === 2 ? [20, 80] : [40]}
        />
      ),
    }))
  ),
];

/** Actual browser assertions use these scenario IDs, not duplicated key-handler helpers. */
export const formKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'radio-group',
    scenario: 'native-radio',
    keys: ['ArrowRight', 'ArrowLeft', 'Space'],
    expectation:
      'Named native radios move selection/focus, skip disabled and submit the selected value.',
  },
  {
    component: 'input-group',
    scenario: 'native-control',
    keys: ['Tab', 'Shift+Tab', 'Home', 'End'],
    expectation: 'Addon/control focus follows visual DOM order and editing remains native.',
  },
  {
    component: 'input-otp',
    scenario: 'native-edit-and-paste',
    keys: ['ArrowLeft', 'Home', 'End', 'Backspace', 'Delete', 'Control+V'],
    expectation: 'One native input edits and replaces selected digits; grouped slots mirror it.',
  },
  {
    component: 'slider',
    scenario: 'native-range',
    keys: ['ArrowRight', 'ArrowLeft', 'Home', 'End'],
    expectation: 'Native range steps and bounds are reflected in values and form data.',
  },
];
