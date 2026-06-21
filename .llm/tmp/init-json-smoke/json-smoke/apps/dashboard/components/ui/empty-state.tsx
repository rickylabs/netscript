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
        'rounded-md border border-dashed border-ns-border px-4 py-4 text-sm text-ns-muted-fg',
        heading ? 'ns-stack ns-stack--xs' : undefined,
        className,
      )}
    >
      {heading && <p class='font-semibold text-ns-fg'>{heading}</p>}
      <div>{children}</div>
    </div>
  );
}
