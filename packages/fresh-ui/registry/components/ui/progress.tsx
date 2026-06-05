/**
 * @component Progress
 * @layer 2
 * @depends theme-seed
 * @description Determinate or indeterminate progress indicator for jobs, uploads, and deferred flows.
 */

import type { JSX } from 'preact';
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

const SIZE_CLASSES: Record<ProgressSize, string> = {
  sm: 'ns-progress--sm',
  md: 'ns-progress--md',
  lg: 'ns-progress--lg',
};

const VARIANT_CLASSES: Record<ProgressVariant, string | undefined> = {
  primary: undefined,
  secondary: 'ns-progress--secondary',
  success: 'ns-progress--success',
  warning: 'ns-progress--warning',
  destructive: 'ns-progress--destructive',
};

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
}: ProgressProps) {
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
      class={cn(
        'ns-progress',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        indeterminate && 'ns-progress--indeterminate',
        className,
      )}
    >
      <span class='ns-progress__track'>
        <span class='ns-progress__bar' style={indeterminate ? undefined : { width }} />
      </span>
    </div>
  );
}
