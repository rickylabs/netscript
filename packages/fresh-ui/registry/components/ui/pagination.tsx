import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface PaginationSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

type PaginationComponent = ((props: PaginationSectionProps) => VNode) & {
  Meta: (props: PaginationSectionProps) => VNode;
  Actions: (props: PaginationSectionProps) => VNode;
};

function PaginationRoot({ children, class: className, ...props }: PaginationSectionProps): VNode {
  return (
    <div {...props} class={cn('flex items-center justify-between gap-3', className)}>
      {children}
    </div>
  );
}

function PaginationMeta({ children, class: className, ...props }: PaginationSectionProps): VNode {
  return <div {...props} class={cn('text-sm text-ns-muted-fg', className)}>{children}</div>;
}

function PaginationActions(
  { children, class: className, ...props }: PaginationSectionProps,
): VNode {
  return <div {...props} class={cn('ns-cluster ns-cluster--sm', className)}>{children}</div>;
}

/**
 * Pagination meta/actions block for list and table navigation.
 */
export const Pagination: PaginationComponent = Object.assign(PaginationRoot, {
  Meta: PaginationMeta,
  Actions: PaginationActions,
});
