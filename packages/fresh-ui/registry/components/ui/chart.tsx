/**
 * @component Chart
 * @layer 2
 * @depends theme-seed empty-state skeleton
 * @description Labeled Cartesian series with native access to exact source values.
 */
import type { VNode } from 'preact';
import { useId, useMemo, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';
import { EmptyState } from './empty-state.tsx';
import { Skeleton } from './skeleton.tsx';

export interface ChartSeries {
  readonly label: string;
}
export interface ChartPoint {
  readonly label: string;
  readonly values: readonly number[];
}
export interface ChartProps {
  title: string;
  description?: string;
  data: readonly ChartPoint[];
  series: readonly ChartSeries[];
  type?: 'area' | 'line';
  /** Legend layout; the plot retains its Cartesian orientation. */
  orientation?: 'horizontal' | 'vertical';
  indicator?: 'dot' | 'line' | 'dashed';
  state?: 'rest' | 'hover' | 'loading' | 'empty';
  /** Explicit number locale shared by server and client. */
  locale?: string;
  class?: string;
}

const PLOT = { width: 520, height: 160, left: 48, top: 12, bottom: 36, right: 12 };
const TICK_INTERVALS = 4;
const SERIES_COLORS = ['var(--ns-chart-1)', 'var(--ns-chart-2)', 'var(--ns-chart-3)'] as const;
const DEFAULT_CHART_LOCALE = 'en-US';

/** Hover is supplemental; the native data disclosure is available without JavaScript. */
export function Chart({
  title,
  description,
  data,
  series,
  type = 'area',
  orientation = 'horizontal',
  indicator = 'dot',
  state = 'rest',
  locale = DEFAULT_CHART_LOCALE,
  class: className,
}: ChartProps): VNode {
  const id = useId(), [hovered, setHovered] = useState<number | null>(null);
  const [numbers, ticks] = useMemo(
    () => [
      new Intl.NumberFormat(locale),
      new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
    ],
    [locale],
  );
  if (series.length < 1 || series.length > SERIES_COLORS.length) {
    throw new RangeError('Chart requires one to three series.');
  }
  for (const point of data) {
    if (
      point.values.length !== series.length || point.values.some((value) => !Number.isFinite(value))
    ) {
      throw new RangeError('Each chart datum requires one finite value per series.');
    }
  }
  const status = state === 'loading'
    ? 'loading'
    : state === 'empty' || !data.length
    ? 'empty'
    : hovered !== null || state === 'hover'
    ? 'hover'
    : 'rest';
  let min = 0, max = 0;
  for (const datum of data) {
    for (const value of datum.values) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  const extent = max - min || 1;
  const x = (index: number) =>
    PLOT.left + PLOT.width * (data.length === 1 ? .5 : index / Math.max(1, data.length - 1));
  const y = (value: number) => PLOT.top + PLOT.height * (1 - (value - min) / extent);
  const selected = status === 'hover' ? Math.min(hovered ?? data.length - 1, data.length - 1) : -1;
  const point = data[selected];
  const height = PLOT.top + PLOT.height + PLOT.bottom, width = PLOT.left + PLOT.width + PLOT.right;
  return (
    <figure
      class={cn('ns-series-chart', className)}
      data-scope='chart'
      data-part='root'
      data-type={type}
      data-series={String(series.length)}
      data-orientation={orientation}
      data-indicator={indicator}
      data-state={status}
      aria-labelledby={`${id}-title`}
      aria-busy={status === 'loading'}
    >
      <figcaption data-scope='chart' data-part='header'>
        <strong id={`${id}-title`} data-scope='chart' data-part='title'>{title}</strong>
        {description && <p data-scope='chart' data-part='description'>{description}</p>}
      </figcaption>
      <div class='ns-series-chart__visual'>
        {status === 'loading'
          ? (
            <div
              data-scope='chart'
              data-part='skeleton'
              role='status'
              aria-label={`Loading ${title}`}
            >
              <Skeleton variant='stats' cards={1} />
            </div>
          )
          : status === 'empty'
          ? (
            <div data-scope='chart' data-part='empty'>
              <EmptyState heading='No data available'>
                Try another period or data source.
              </EmptyState>
            </div>
          )
          : (
            <>
              <svg
                data-scope='chart'
                data-part='plot'
                viewBox={`0 0 ${width} ${height}`}
                role='img'
                aria-labelledby={`${id}-plot-title`}
                aria-describedby={`${id}-plot-description`}
                onPointerLeave={() => setHovered(null)}
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const coordinate = (event.clientX - rect.left) / rect.width * width - PLOT.left;
                  setHovered(
                    coordinate < 0 || coordinate > PLOT.width
                      ? null
                      : Math.round(coordinate / PLOT.width * Math.max(0, data.length - 1)),
                  );
                }}
              >
                <title id={`${id}-plot-title`}>{title}</title>
                <desc id={`${id}-plot-description`}>
                  {series.map((item) => item.label).join(', ')}. Exact labeled values are available
                  in the data table below.
                </desc>
                <g data-scope='chart' data-part='grid'>
                  {Array.from({ length: TICK_INTERVALS + 1 }, (_, index) => {
                    const level = PLOT.top + PLOT.height * index / TICK_INTERVALS;
                    return (
                      <line
                        key={index}
                        x1={PLOT.left}
                        x2={width - PLOT.right}
                        y1={level}
                        y2={level}
                      />
                    );
                  })}
                </g>
                <g data-scope='chart' data-part='axis-y'>
                  {Array.from(
                    { length: TICK_INTERVALS + 1 },
                    (_, index) => (
                      <text
                        key={index}
                        x={PLOT.left - 8}
                        y={PLOT.top + PLOT.height * index / TICK_INTERVALS + 4}
                        text-anchor='end'
                      >
                        {ticks.format(min + extent * (1 - index / TICK_INTERVALS))}
                      </text>
                    ),
                  )}
                </g>
                {series.map((_item, index) => {
                  const coordinates = data.map((datum, n) => `${x(n)},${y(datum.values[index])}`)
                    .join(' ');
                  return (
                    <g
                      key={index}
                      data-scope='chart'
                      data-part={`series-${index + 1}`}
                      style={{ '--ns-series-color': SERIES_COLORS[index] }}
                    >
                      {type === 'area' && (
                        <polygon
                          data-scope='chart'
                          data-part='area'
                          points={`${x(0)},${y(0)} ${coordinates} ${x(data.length - 1)},${y(0)}`}
                        />
                      )}
                      <polyline data-scope='chart' data-part='line' points={coordinates} />
                      {data.length === 1 && (
                        <circle
                          data-scope='chart'
                          data-part='line'
                          cx={x(0)}
                          cy={y(data[0].values[index])}
                          r='3'
                        />
                      )}
                    </g>
                  );
                })}
                <g data-scope='chart' data-part='axis-x'>
                  {data.map((datum, index) =>
                    index % Math.max(1, Math.ceil((data.length - 1) / 5)) === 0 ||
                      index === data.length - 1
                      ? (
                        <text
                          key={index}
                          x={x(index)}
                          y={PLOT.top + PLOT.height + 22}
                          text-anchor='middle'
                        >
                          {datum.label}
                        </text>
                      )
                      : null
                  )}
                </g>
                {point && (
                  <g data-scope='chart' data-part='cursor' aria-hidden='true'>
                    <line
                      x1={x(selected)}
                      x2={x(selected)}
                      y1={PLOT.top}
                      y2={PLOT.top + PLOT.height}
                    />
                    {point.values.map((value, index) => (
                      <circle
                        key={index}
                        cx={x(selected)}
                        cy={y(value)}
                        r='4'
                        style={{ '--ns-series-color': SERIES_COLORS[index] }}
                      />
                    ))}
                  </g>
                )}
              </svg>
              {point && (
                <div
                  data-scope='chart'
                  data-part='tooltip'
                  aria-hidden='true'
                  style={{
                    left: `${x(selected) / width * 100}%`,
                    transform: selected > (data.length - 1) / 2 ? 'translateX(-100%)' : undefined,
                  }}
                >
                  <strong>{point.label}</strong>
                  {series.map((item, index) => (
                    <div
                      key={index}
                      class='ns-series-chart__entry'
                      style={{ '--ns-series-color': SERIES_COLORS[index] }}
                    >
                      <span data-scope='chart' data-part='swatch' />
                      <span data-scope='chart' data-part='label'>{item.label}</span>
                      <span data-scope='chart' data-part='value'>
                        {numbers.format(point.values[index])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
      </div>
      <ul data-scope='chart' data-part='legend' aria-label={`${title} series`}>
        {series.map((item, index) => (
          <li
            key={index}
            class='ns-series-chart__entry'
            style={{ '--ns-series-color': SERIES_COLORS[index] }}
          >
            <span data-scope='chart' data-part='swatch' aria-hidden='true' />
            <span data-scope='chart' data-part='label'>{item.label}</span>
          </li>
        ))}
      </ul>
      <details data-scope='chart' data-part='data'>
        <summary data-scope='chart' data-part='data-trigger'>View {title} data</summary>
        <table data-scope='chart' data-part='table'>
          <caption>{title} source values</caption>
          <thead>
            <tr>
              <th scope='col'>Period</th>
              {series.map((item, index) => <th key={index} scope='col'>{item.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {status === 'empty'
              ? (
                <tr>
                  <td colSpan={series.length + 1}>No data available</td>
                </tr>
              )
              : data.map((datum, index) => (
                <tr key={index}>
                  <th scope='row'>{datum.label}</th>
                  {datum.values.map((value, n) => <td key={n}>{numbers.format(value)}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
