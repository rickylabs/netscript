import { Calendar } from '../../registry/components/ui/calendar.tsx';
import { DatePicker } from '../../registry/components/ui/date-picker.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const calendarFixtures: readonly ContractRenderFixture[] = [
  ...(['label', 'dropdown'] as const).flatMap((caption) =>
    ([1, 2] as const).map((months) => ({
      component: 'calendar',
      scenario: `${caption}/${months}`,
      props: ['caption', 'months', 'mode', 'defaultValue', 'today', 'min', 'max'],
      parts: ['header', 'nav-prev', 'nav-next', 'caption', 'weekdays', 'grid', 'day'],
      attributes: ['data-caption', 'data-months', 'data-state', 'data-range'],
      render: () => (
        <Calendar
          caption={caption}
          months={months}
          mode='range'
          defaultValue={['2024-02-28', '2024-03-02']}
          today='2024-02-28'
          min='2024-02-01'
          max='2024-03-31'
        />
      ),
    }))
  ),
  ...(['single', 'range'] as const).map((mode) => ({
    component: 'date-picker',
    scenario: mode,
    props: ['label', 'mode', 'name', 'defaultValue', 'defaultMonth'],
    parts: ['trigger', 'content', 'title', 'description', 'close'],
    attributes: ['data-mode', 'data-state'],
    render: () => (
      <DatePicker
        label='Delivery'
        name='delivery'
        mode={mode}
        defaultValue={['2024-02-28']}
        defaultMonth='2024-02-01'
      />
    ),
  })),
];

export const calendarKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'calendar',
    scenario: 'gregorian-grid',
    keys: [
      'ArrowRight',
      'ArrowLeft',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Shift+PageDown',
      'Enter',
      'Space',
    ],
    expectation:
      'Roving enabled days cross leap/month/year bounds without changing selection until activation.',
  },
  {
    component: 'date-picker',
    scenario: 'modal-calendar',
    keys: ['Enter', 'ArrowRight', 'Tab', 'Shift+Tab', 'Escape', 'Space'],
    expectation:
      'Native modal traps focus, accepts dates and restores trigger focus on completion or Escape.',
  },
];
