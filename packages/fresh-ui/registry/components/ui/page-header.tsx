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
  return (
    <div
      {...props}
      class={cn('ns-page-header', className)}
      data-part='root'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderLayout({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-page-header__layout', className)}
      data-part='layout'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderMain({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-stack ns-page-header__main', className)}
      data-gap='md'
      data-part='main'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderAside({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-stack', className)}
      data-gap='md'
      data-part='aside'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderBadges({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div {...props} class={cn('ns-cluster', className)} data-part='badges' data-scope='page-header'>
      {children}
    </div>
  );
}

function PageHeaderIntro({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-stack ns-page-header__intro', className)}
      data-gap='sm'
      data-part='intro'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderActions(
  { children, class: className, ...props }: PageHeaderSectionProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-cluster', className)}
      data-part='actions'
      data-scope='page-header'
    >
      {children}
    </div>
  );
}

function PageHeaderStatus({ children, class: className, ...props }: PageHeaderSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-status-bar', className)}
      data-part='status-bar'
      data-scope='page-header'
    >
      {children}
    </div>
  );
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
