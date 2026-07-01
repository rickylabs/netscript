/**
 * @component ChartBlock
 * @layer 2
 * @depends theme-seed
 * @description Inline, token-driven metric chart — horizontal bars (default,
 * for long categorical labels) or a vertical column chart with y-axis ticks.
 * Intents via data-tone; never a hardcoded color.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * Semantic bar intent.
 */
export type ChartTone = 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';

/**
 * A single chart entry.
 */
export interface ChartDatum {
  label: string;
  value: number;
  tone?: ChartTone;
}

interface ChartBlockProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  data: ChartDatum[];
  title?: string;
  sub?: string;
  unit?: string;
  variant?: 'bar' | 'column';
  class?: string;
}

const TICKS = 4;

/**
 * Rounds a value up to a "nice" axis maximum (1/2/5 × 10ⁿ).
 */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function formatTick(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return `${Math.round(n * 100) / 100}`;
}

/**
 * Renders a horizontal-bar or vertical-column metric chart.
 */
export function ChartBlock(
  { data, title, sub, unit = '', variant = 'bar', class: className, ...props }: ChartBlockProps,
): VNode {
  const max = niceMax(Math.max(0, ...data.map((datum) => datum.value)));

  if (variant === 'column') {
    const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (max / TICKS) * (TICKS - i));
    return (
      <div {...props} class={cn('ns-colchart', className)}>
        {title ? <div class='ns-chart__title'>{title}</div> : null}
        {sub ? <div class='ns-chart__sub'>{sub}</div> : null}
        <div class='ns-colchart__plot'>
          <div class='ns-colchart__yaxis'>
            {ticks.map((tick, i) => (
              <span key={i} class='ns-colchart__ytick'>{formatTick(tick)}</span>
            ))}
          </div>
          <div class='ns-colchart__grid'>
            {data.map((datum, i) => (
              <div key={i} class='ns-colchart__col'>
                <div
                  class='ns-colchart__bar'
                  data-tone={datum.tone}
                  style={{ height: `${(datum.value / max) * 100}%` }}
                >
                  <span class='ns-colchart__val'>{`${datum.value}${unit}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div class='ns-colchart__xaxis'>
          {data.map((datum, i) => <span key={i}>{datum.label}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div {...props} class={cn('ns-chart', className)}>
      {title ? <div class='ns-chart__title'>{title}</div> : null}
      {sub ? <div class='ns-chart__sub'>{sub}</div> : null}
      {data.map((datum) => (
        <div class='ns-chart__row'>
          <span class='ns-chart__label'>{datum.label}</span>
          <span class='ns-chart__track'>
            <span
              class='ns-chart__bar'
              data-tone={datum.tone}
              style={{ width: `${(datum.value / max) * 100}%` }}
            />
          </span>
          <span class='ns-chart__value'>{`${datum.value}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}
