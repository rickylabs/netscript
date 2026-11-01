/**
 * @component ScrollArea
 * @layer 2
 * @depends theme-seed, cn
 * @description Named native scrolling viewport with no simulated scrollbar controls.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Inputs for a named native scrolling region; root dimensions belong to the caller. */
export interface ScrollAreaProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Accessible name of the focusable viewport. */
  label: string;
  /** Native overflow axes; defaults to vertical. */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Content inside the viewport, retaining its native keyboard behavior. */
  children?: ComponentChildren;
  /** Additional classes on the frame. */
  class?: string;
}

/**
 * Render a consistently tabbable native viewport, including before content overflows.
 * @example
 * ```tsx
 * <ScrollArea label='Recent activity' style={{ height: 200 }}>Activity</ScrollArea>
 * ```
 */
export function ScrollArea(
  { label, orientation = 'vertical', children, class: className, ...props }: ScrollAreaProps,
): VNode {
  if (!label.trim()) throw new TypeError('ScrollArea label must name the native viewport');
  return (
    <div
      {...props}
      class={cn('ns-scroll-area', className)}
      data-scope='scroll-area'
      data-part='root'
      data-orientation={orientation}
    >
      <div
        class='ns-scroll-area__viewport'
        data-scope='scroll-area'
        data-part='viewport'
        role='region'
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
