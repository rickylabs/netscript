/**
 * @component Badge
 * @layer 2
 * @depends theme-seed
 * @description Compact semantic status label for entity state, tags, and counters.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/**
 * Visual variants for badge labels.
 */
export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

interface BadgeProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  variant?: BadgeVariant;
}

/**
 * Renders a compact semantic label for status, tags, and counters.
 */
export function Badge(
  { children, class: className, variant = 'secondary', ...props }: BadgeProps,
): VNode {
  return (
    <span
      {...props}
      class={cn('ns-badge', className)}
      data-variant={variant}
      data-part='root'
      data-scope='badge'
      data-emphasis='subtle'
    >
      <span data-part='label' data-scope='badge'>{children}</span>
    </span>
  );
}
