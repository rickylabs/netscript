import { StatsGrid } from '../../registry/components/ui/stats-grid.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const statsGridFixtures: readonly ContractRenderFixture[] = [
  ...([2, 3, 4] as const).flatMap((columns) =>
    [false, true].map((joined) => ({
      component: 'stats-grid',
      scenario: `columns-${columns}/joined-${joined}`,
      props: ['children', 'columns', 'joined', 'label', 'value', 'detail', 'variant', 'delta'],
      parts: ['card', 'header', 'body', 'label', 'value', 'detail', 'delta'],
      attributes: ['data-columns', 'data-joined', 'data-variant', 'data-delta'],
      render: () => (
        <StatsGrid columns={columns} joined={joined}>
          <StatsGrid.Card
            label='Revenue'
            value='$284,920'
            detail='+8.2% versus the previous period'
            delta='up'
          />
          <StatsGrid.Card
            label='Orders'
            value='3,182'
            detail='-1.3% versus the previous period'
            delta='down'
            variant='hero'
          />
        </StatsGrid>
      ),
    }))
  ),
  {
    component: 'stats-grid',
    scenario: 'optional-content',
    props: ['children', 'label', 'value', 'badge', 'icon', 'sparkline', 'ticks', 'blockbars'],
    parts: ['badge', 'icon', 'sparkline', 'ticks', 'blockbars'],
    render: () => (
      <StatsGrid>
        <StatsGrid.Card
          label='Orders'
          value='42'
          badge={<button type='button'>Inspect orders</button>}
          icon='ⓘ'
          sparkline={
            <svg viewBox='0 0 10 10'>
              <path d='M0 9L10 1' />
            </svg>
          }
          ticks='Ticks'
          blockbars='Bars'
        />
      </StatsGrid>
    ),
  },
  {
    component: 'stats-grid',
    scenario: 'automatic-defaults',
    props: ['children', 'label', 'value'],
    render: () => (
      <StatsGrid>
        <StatsGrid.Card label='Count' value='42' />
      </StatsGrid>
    ),
  },
];

export const statsGridKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'stats-grid',
  scenario: 'stats-grid/native-child-controls',
  keys: ['Tab/Shift+Tab'],
  expectation:
    'Only caller-owned controls receive focus; decorative slots are inert and the grid adds no keyboard handler.',
}];
