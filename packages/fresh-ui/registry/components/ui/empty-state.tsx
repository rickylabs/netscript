import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface EmptyStateProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  heading?: Renderable;
}

/**
 * Renders a muted empty-state callout for lists, rails, and dashboards.
 */
export function EmptyState(
  { children, class: className, heading, ...props }: EmptyStateProps,
): VNode {
  return (
    <div
      {...props}
      class={cn(
        'ns-empty-state',
        heading ? 'ns-stack ns-stack--xs' : undefined,
        className,
      )}
    >
      {heading && <p class='ns-empty-state__heading'>{heading}</p>}
      <div>{children}</div>
    </div>
  );
}
