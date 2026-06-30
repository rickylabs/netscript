/**
 * @component Donut
 * @layer 2
 * @depends theme-seed
 * @description Token-driven donut/pie chart — SVG arc segments (stroke-dasharray)
 * with a center total and a legend. Segment colors come from data-tone or a
 * semantic-token cycle; never a hardcoded color.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * Semantic segment intent.
 */
export type DonutTone = 'primary' | 'success' | 'warning' | 'secondary' | 'destructive';

/**
 * A single donut segment.
 */
export interface DonutDatum {
  label: string;
  value: number;
  tone?: DonutTone;
}

interface DonutProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  data: DonutDatum[];
  /** Override the center label (defaults to the sum). */
  total?: string | number;
  class?: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CYCLE: DonutTone[] = ['primary', 'success', 'warning', 'secondary', 'destructive'];

/**
 * Renders a donut chart with a center total and legend.
 */
export function Donut({ data, total, class: className, ...props }: DonutProps): VNode {
  const sum = data.reduce((acc, datum) => acc + datum.value, 0) || 1;
  let offset = 0;

  return (
    <div {...props} class={cn('ns-donut', className)}>
      <svg class='ns-donut__svg' viewBox='0 0 100 100' role='img' aria-hidden='true'>
        <g transform='rotate(-90 50 50)'>
          {data.map((datum, index) => {
            const tone = datum.tone ?? CYCLE[index % CYCLE.length];
            const length = (datum.value / sum) * CIRCUMFERENCE;
            const ring = (
              <circle
                class='ns-donut__ring'
                data-tone={tone}
                cx='50'
                cy='50'
                r={RADIUS}
                fill='none'
                stroke-width='12'
                stroke-dasharray={`${length} ${CIRCUMFERENCE - length}`}
                stroke-dashoffset={-offset}
              />
            );
            offset += length;
            return ring;
          })}
        </g>
      </svg>
      <div class='ns-donut__center'>{total ?? sum}</div>
      <ul class='ns-donut__legend'>
        {data.map((datum, index) => (
          <li class='ns-donut__row'>
            <span class='ns-donut__swatch' data-tone={datum.tone ?? CYCLE[index % CYCLE.length]} />
            {datum.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
