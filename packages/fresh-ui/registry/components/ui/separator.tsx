/**
 * @component Separator
 * @layer 2
 * @depends theme-seed
 * @description Lightweight divider for separating content groups in cards, forms, and toolbars.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface SeparatorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  class?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Renders a horizontal or vertical separator.
 */
export function Separator(
  { class: className, orientation = 'horizontal', ...props }: SeparatorProps,
): VNode {
  return (
    <div
      {...props}
      role='separator'
      aria-orientation={orientation}
      class={cn(
        'ns-separator',
        orientation === 'vertical' && 'ns-separator--vertical',
        className,
      )}
    />
  );
}
