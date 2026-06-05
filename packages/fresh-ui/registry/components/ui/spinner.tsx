/**
 * @component Spinner
 * @layer 2
 * @depends theme-seed
 * @description Small loading indicator for async actions and deferred surfaces.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/**
 * Size variants for the spinner primitive.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  class?: string;
  label?: string;
  size?: SpinnerSize;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'ns-spinner--sm',
  md: 'ns-spinner--md',
  lg: 'ns-spinner--lg',
};

/**
 * Renders a loading spinner with optional accessible label text.
 */
export function Spinner({ class: className, label, size = 'md', ...props }: SpinnerProps): VNode {
  const indicatorClass = cn('ns-spinner', SIZE_CLASSES[size], !label && className);

  if (!label) {
    return <span {...props} aria-hidden='true' class={indicatorClass} />;
  }

  return (
    <span {...props} role='status' aria-label={label} class={className}>
      <span aria-hidden='true' class={cn('ns-spinner', SIZE_CLASSES[size])} />
      <span class='sr-only'>{label}</span>
    </span>
  );
}
