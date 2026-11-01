/**
 * @component Progress
 * @layer 2
 * @depends theme-seed
 * @description Determinate or indeterminate progress indicator for jobs, uploads, and deferred flows.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export type ProgressVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  class?: string;
  indeterminate?: boolean;
  label?: string;
  max?: number;
  size?: ProgressSize;
  value?: number;
  variant?: ProgressVariant;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function Progress({
  class: className,
  indeterminate = false,
  label = 'Progress',
  max = 100,
  size = 'md',
  value = 0,
  variant = 'primary',
  ...props
}: ProgressProps): VNode {
  const safeMax = max > 0 ? max : 100;
  const normalizedValue = clamp(value, 0, safeMax);
  const width = `${(normalizedValue / safeMax) * 100}%`;

  return (
    <div
      {...props}
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={indeterminate ? undefined : normalizedValue}
      class={cn('ns-progress', className)}
      data-size={size}
      data-variant={variant}
      data-state={indeterminate ? 'loading' : 'rest'}
      data-part='root'
      data-scope='progress'
    >
      <span class='ns-progress__track' data-part='track' data-scope='progress'>
        <span
          class='ns-progress__bar'
          data-part='bar'
          data-scope='progress'
          style={indeterminate ? undefined : { width }}
        />
      </span>
    </div>
  );
}
