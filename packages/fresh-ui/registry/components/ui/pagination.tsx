import type { JSX, VNode } from 'preact';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface PaginationSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

interface PaginationProps extends PaginationSectionProps {
  variant?: 'numbered' | 'pager';
}

type PaginationComponent = ((props: PaginationProps) => VNode) & {
  Meta: (props: PaginationSectionProps) => VNode;
  Actions: (props: PaginationSectionProps) => VNode;
  Link: (props: PaginationLinkProps) => VNode;
  Previous: (props: Omit<PaginationLinkProps, 'type'>) => VNode;
  Next: (props: Omit<PaginationLinkProps, 'type'>) => VNode;
  Ellipsis: (props: JSX.HTMLAttributes<HTMLSpanElement>) => VNode;
};

/** Native destination; href is required unless disabled or state=disabled. */
export interface PaginationLinkProps
  extends
    Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'children' | 'href' | 'type'> {
  children?: Renderable;
  href?: string;
  class?: string;
  type?: 'page' | 'previous' | 'next';
  current?: boolean;
  disabled?: boolean;
  state?: 'rest' | 'hover' | 'focus' | 'current' | 'disabled';
}

function PaginationRoot(
  { children, class: className, variant = 'numbered', ...props }: PaginationProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-pagination', className)}
      role={props.role ?? 'navigation'}
      aria-label={props['aria-label'] ?? 'Pagination'}
      data-variant={variant}
      data-part='root'
      data-scope='pagination'
    >
      {children}
    </div>
  );
}

/** Keys and tiles share the same disabled/current native-link policy. */
function PaginationDestination(
  {
    children,
    class: className,
    href,
    type = 'page',
    current = false,
    disabled = false,
    state = 'rest',
    tile = false,
    ...props
  }: PaginationLinkProps & { tile?: boolean },
): VNode {
  const unavailable = disabled || state === 'disabled';
  const active = current || state === 'current';
  if (!unavailable && href === undefined) {
    throw new RangeError('Enabled pagination links require href.');
  }
  const previous = type === 'previous';
  const label = previous ? 'Previous' : type === 'next' ? 'Next' : 'Page';
  const icon = type !== 'page'
    ? (
      <span class='ns-pagination__icon' aria-hidden='true' data-scope='pagination' data-part='icon'>
        <Icon
          name={tile
            ? previous ? 'arrow-left' : 'arrow-right'
            : previous
            ? 'chevron-left'
            : 'chevron-right'}
          size={16}
        />
      </span>
    )
    : null;
  return (
    <a
      {...props}
      class={cn(tile ? 'ns-pagination__tile' : 'ns-pagination__key', className)}
      href={unavailable ? undefined : href}
      role={unavailable ? 'link' : props.role}
      tabIndex={unavailable ? -1 : props.tabIndex}
      rel={props.rel ?? (type === 'page' ? undefined : previous ? 'prev' : 'next')}
      aria-disabled={unavailable ? 'true' : props['aria-disabled']}
      aria-current={active ? 'page' : props['aria-current']}
      data-scope='pagination'
      data-part={tile ? type : 'key'}
      data-type={type}
      data-state={unavailable ? 'disabled' : active ? 'current' : state}
      onClick={(event) => {
        if (unavailable) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        props.onClick?.(event);
      }}
    >
      {tile
        ? (
          <>
            <span class='ns-pagination__direction' data-scope='pagination' data-part='direction'>
              {previous && icon}
              {label}
              {!previous && icon}
            </span>
            <span class='ns-pagination__title' data-scope='pagination' data-part='title'>
              {children}
            </span>
          </>
        )
        : <>{previous && icon}{children ?? label}{type === 'next' && icon}</>}
    </a>
  );
}

function PaginationPrevious(props: Omit<PaginationLinkProps, 'type'>): VNode {
  return <PaginationDestination {...props} type='previous' tile />;
}
function PaginationNext(props: Omit<PaginationLinkProps, 'type'>): VNode {
  return <PaginationDestination {...props} type='next' tile />;
}
function PaginationEllipsis(
  { class: className, children = '…', ...props }: JSX.HTMLAttributes<HTMLSpanElement>,
): VNode {
  return (
    <span
      {...props}
      class={cn('ns-pagination__ellipsis', typeof className === 'string' ? className : undefined)}
      aria-hidden='true'
      data-scope='pagination'
      data-part='ellipsis'
      data-type='ellipsis'
      data-state='rest'
    >
      {children}
    </span>
  );
}

function PaginationMeta({ children, class: className, ...props }: PaginationSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-pagination__meta', className)}
      data-part='meta'
      data-scope='pagination'
    >
      {children}
    </div>
  );
}

function PaginationActions(
  { children, class: className, ...props }: PaginationSectionProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-cluster', className)}
      data-gap='sm'
      data-part='actions'
      data-scope='pagination'
    >
      {children}
    </div>
  );
}

/**
 * Pagination meta/actions block for list and table navigation.
 */
export const Pagination: PaginationComponent = Object.assign(PaginationRoot, {
  Meta: PaginationMeta,
  Actions: PaginationActions,
  Link: PaginationDestination,
  Previous: PaginationPrevious,
  Next: PaginationNext,
  Ellipsis: PaginationEllipsis,
});
