import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface PageHeaderSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

type PageHeaderComponent = ((props: PageHeaderSectionProps) => VNode) & {
  Layout: (props: PageHeaderSectionProps) => VNode;
  Main: (props: PageHeaderSectionProps) => VNode;
  Aside: (props: PageHeaderSectionProps) => VNode;
  Badges: (props: PageHeaderSectionProps) => VNode;
  Intro: (props: PageHeaderSectionProps) => VNode;
  Actions: (props: PageHeaderSectionProps) => VNode;
  Status: (props: PageHeaderSectionProps) => VNode;
};

function PageHeaderRoot({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-page-header', className)}>{children}</div>;
}

function PageHeaderLayout({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn(
        'grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px] xl:items-start',
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageHeaderMain({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-stack ns-stack--md min-w-0', className)}>{children}</div>;
}

function PageHeaderAside({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-stack ns-stack--md', className)}>{children}</div>;
}

function PageHeaderBadges({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-cluster', className)}>{children}</div>;
}

function PageHeaderIntro({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-stack ns-stack--sm min-w-0', className)}>{children}</div>;
}

function PageHeaderActions(
  { children, class: className, ...props }: PageHeaderSectionProps,
): VNode {
  return <div {...props} class={cn('ns-cluster', className)}>{children}</div>;
}

function PageHeaderStatus({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return <div {...props} class={cn('ns-status-bar flex-wrap', className)}>{children}</div>;
}

/**
 * Page header block with layout, intro, badges, actions, and status regions.
 */
export const PageHeader: PageHeaderComponent = Object.assign(PageHeaderRoot, {
  Layout: PageHeaderLayout,
  Main: PageHeaderMain,
  Aside: PageHeaderAside,
  Badges: PageHeaderBadges,
  Intro: PageHeaderIntro,
  Actions: PageHeaderActions,
  Status: PageHeaderStatus,
});
