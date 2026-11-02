import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface PageHeaderSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

/** Utility header presentation; nested controls retain their own behavior. */
export type PageHeaderVariant = 'default' | 'with-tabs' | 'with-status';

/** Declarative content composes the same sections available through the namespace. */
export interface PageHeaderProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title'> {
  /** Additional composed sections, preserved in source order. */
  children?: Renderable;
  /** Optional class on the component root. */
  class?: string;
  /** Header presentation marker; omitted slots remain empty. */
  variant?: PageHeaderVariant;
  /** Native h1 content; this replaces HTML's root title tooltip attribute. */
  title?: Renderable;
  /** Optional short category label before the heading. */
  eyebrow?: Renderable;
  /** Optional supporting text after the heading. */
  description?: Renderable;
  /** Caller-owned Breadcrumb or native navigation content. */
  breadcrumb?: Renderable;
  /** Caller-owned links and buttons after the intro. */
  actions?: Renderable;
  /** Caller-owned Tabs or navigation after the heading row. */
  tabs?: Renderable;
  /** Caller-owned status content after the heading row and tabs. */
  status?: Renderable;
}

type PageHeaderComponent = ((props: PageHeaderProps) => VNode) & {
  Layout: (props: PageHeaderSectionProps) => VNode;
  Main: (props: PageHeaderSectionProps) => VNode;
  Aside: (props: PageHeaderSectionProps) => VNode;
  Badges: (props: PageHeaderSectionProps) => VNode;
  Intro: (props: PageHeaderSectionProps) => VNode;
  Actions: (props: PageHeaderSectionProps) => VNode;
  Status: (props: PageHeaderSectionProps) => VNode;
};

/** Empty primitive/array slots create no wrapper; zero remains visible content. */
function hasContent(content: Renderable): boolean {
  return content != null && typeof content !== 'boolean' && content !== '' &&
    (!Array.isArray(content) || content.some(hasContent));
}

function PageHeaderRoot({
  children,
  class: className,
  variant = 'default',
  title,
  eyebrow,
  description,
  breadcrumb,
  actions,
  tabs,
  status,
  ...props
}: PageHeaderProps): VNode {
  const hasIntro = [title, eyebrow, description].some(hasContent);
  return (
    <div
      {...props}
      class={cn('ns-page-header', className)}
      data-part='root'
      data-scope='page-header'
      data-variant={variant}
    >
      {hasContent(breadcrumb) && (
        <div class='ns-page-header__breadcrumb' data-part='breadcrumb' data-scope='page-header'>
          {breadcrumb}
        </div>
      )}
      {(hasIntro || hasContent(actions)) && (
        <div class='ns-page-header__heading' data-part='layout' data-scope='page-header'>
          {hasIntro && (
            <PageHeaderMain>
              <PageHeaderIntro>
                {hasContent(eyebrow) && (
                  <p class='ns-page-header__eyebrow' data-part='eyebrow' data-scope='page-header'>
                    {eyebrow}
                  </p>
                )}
                {hasContent(title) && (
                  <h1 class='ns-page-header__title' data-part='title' data-scope='page-header'>
                    {title}
                  </h1>
                )}
                {hasContent(description) && (
                  <p
                    class='ns-page-header__description'
                    data-part='description'
                    data-scope='page-header'
                  >
                    {description}
                  </p>
                )}
              </PageHeaderIntro>
            </PageHeaderMain>
          )}
          {hasContent(actions) && <PageHeaderActions>{actions}</PageHeaderActions>}
        </div>
      )}
      {hasContent(tabs) && (
        <div class='ns-page-header__tabs' data-part='tabs' data-scope='page-header'>{tabs}</div>
      )}
      {hasContent(status) && <PageHeaderStatus>{status}</PageHeaderStatus>}
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
      class={cn('ns-cluster ns-page-header__actions', className)}
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
      class={cn('ns-status-bar ns-page-header__status', className)}
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
