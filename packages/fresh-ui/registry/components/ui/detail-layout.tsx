import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface DetailLayoutSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

type DetailLayoutComponent = ((props: DetailLayoutSectionProps) => VNode) & {
  Main: (props: DetailLayoutSectionProps) => VNode;
  Aside: (props: DetailLayoutSectionProps) => VNode;
};

function DetailLayoutRoot({ children, class: className, ...props }: DetailLayoutSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]', className)}
    >
      {children}
    </div>
  );
}

function DetailLayoutMain({ children, class: className, ...props }: DetailLayoutSectionProps): VNode {
  return <div {...props} class={cn('ns-stack ns-stack--md', className)}>{children}</div>;
}

function DetailLayoutAside({ children, class: className, ...props }: DetailLayoutSectionProps): VNode {
  return <div {...props} class={cn('ns-stack ns-stack--md', className)}>{children}</div>;
}

/**
 * Two-column detail-page layout with main and aside regions.
 */
export const DetailLayout: DetailLayoutComponent = Object.assign(DetailLayoutRoot, {
  Main: DetailLayoutMain,
  Aside: DetailLayoutAside,
});
