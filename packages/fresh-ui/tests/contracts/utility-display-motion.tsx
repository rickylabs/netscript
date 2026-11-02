import { Chart } from '../../registry/components/ui/chart.tsx';
import { Carousel } from '../../registry/components/ui/carousel.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

const series = [{ label: 'Web' }, { label: 'Marketplace' }, { label: 'Retail' }];
const data = [
  { label: 'January', values: [20, 10, 5] },
  { label: 'February', values: [30, 15, 7] },
  { label: 'March', values: [40, 20, 10] },
];

export const displayMotionFixtures: readonly ContractRenderFixture[] = [
  ...(['area', 'line'] as const).flatMap((type) =>
    [1, 2, 3].flatMap((count) =>
      (['rest', 'hover', 'loading', 'empty'] as const).map((state) => ({
        component: 'chart',
        scenario: `${type}/${count}/${state}`,
        props: ['type', 'series', 'data', 'title', 'description', 'state'],
        parts: [
          'header',
          'title',
          'description',
          'legend',
          'swatch',
          'label',
          'data',
          'data-trigger',
          'table',
          ...(state === 'loading' ? ['skeleton'] : state === 'empty' ? ['empty'] : [
            'plot',
            'grid',
            'axis-x',
            'axis-y',
            'line',
            ...Array.from({ length: count }, (_, n) => `series-${n + 1}`),
            ...(type === 'area' ? ['area'] : []),
            ...(state === 'hover' ? ['cursor', 'tooltip', 'value'] : []),
          ]),
        ],
        attributes: [
          'data-type',
          'data-series',
          'data-orientation',
          'data-indicator',
          'data-state',
        ],
        render: () => (
          <Chart
            title='Revenue'
            description='Monthly revenue'
            type={type}
            state={state}
            series={series.slice(0, count)}
            data={data.map((point) => ({ ...point, values: point.values.slice(0, count) }))}
          />
        ),
      }))
    )
  ),
  ...(['horizontal', 'vertical'] as const).flatMap((orientation) =>
    (['dot', 'line', 'dashed'] as const).map((indicator) => ({
      component: 'chart',
      scenario: `${orientation}/${indicator}`,
      props: ['title', 'series', 'data', 'orientation', 'indicator', 'state', 'locale'],
      parts: ['tooltip', 'cursor', 'legend'],
      attributes: ['data-orientation', 'data-indicator'],
      render: () => (
        <Chart
          title='Revenue'
          series={series}
          data={data}
          state='hover'
          orientation={orientation}
          indicator={indicator}
          locale={orientation === 'vertical' ? 'de-DE' : 'en-US'}
        />
      ),
    }))
  ),
  ...(['horizontal', 'vertical'] as const).flatMap((orientation) =>
    (['outside', 'inside'] as const).flatMap((controls) =>
      [false, true].flatMap((dots) =>
        [false, true].map((counter) => ({
          component: 'carousel',
          scenario: `${orientation}/${controls}/${dots}/${counter}`,
          props: ['label', 'slides', 'orientation', 'controls', 'dots', 'counter', 'defaultIndex'],
          parts: [
            'viewport',
            'slide',
            'previous',
            'next',
            ...(dots ? ['dots', 'dot'] : []),
            ...(counter ? ['counter'] : []),
            ...(dots || counter ? ['pagination'] : []),
          ],
          attributes: ['data-orientation', 'data-controls'],
          render: () => (
            <Carousel
              label='Projects'
              orientation={orientation}
              controls={controls}
              dots={dots}
              counter={counter}
              defaultIndex={1}
              slides={[{ label: 'One', content: <a href='#one'>Project One</a> }, {
                label: 'Two',
                content: <a href='#two'>Project Two</a>,
              }]}
            />
          ),
        }))
      )
    )
  ),
  {
    component: 'carousel',
    scenario: 'empty',
    props: ['label', 'slides', 'counter'],
    parts: ['viewport', 'empty', 'counter'],
    render: () => <Carousel label='Empty' slides={[]} counter />,
  },
];

export const displayMotionKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'chart',
    scenario: 'native-data-disclosure',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Native disclosure reveals labeled exact values; SVG adds no arbitrary focus targets.',
  },
  {
    component: 'carousel',
    scenario: 'native-controls-and-boundaries',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Native controls move one bounded slide and retain focus; inactive slide content is inert after hydration.',
  },
];
