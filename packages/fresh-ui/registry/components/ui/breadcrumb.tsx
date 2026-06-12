import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/**
 * Breadcrumb step metadata for route context navigation.
 */
export interface BreadcrumbItem {
  /** Visible crumb label. */
  label: string;
  /** Optional destination for navigable crumbs. */
  href?: string;
  /** Optional leading visual marker for the crumb. */
  icon?: Renderable;
}

interface BreadcrumbProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  items: readonly BreadcrumbItem[];
  class?: string;
}

/**
 * Renders an accessible breadcrumb trail.
 */
export function Breadcrumb({ items, class: className, ...props }: BreadcrumbProps): VNode | null {
  if (items.length === 0) return null;

  return (
    <nav {...props} aria-label='Breadcrumb' class={cn('ns-breadcrumb', className)}>
      <ol class='ns-breadcrumb' role='list'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} class='ns-breadcrumb__item'>
              {index > 0 && <span class='ns-breadcrumb__separator' aria-hidden='true'>/</span>}
              {isLast
                ? (
                  <span class='ns-breadcrumb__current' aria-current='page'>
                    {item.icon && <span aria-hidden='true'>{item.icon}</span>}
                    {item.label}
                  </span>
                )
                : item.href
                ? (
                  <a href={item.href} class='ns-breadcrumb__link'>
                    {item.icon && <span aria-hidden='true'>{item.icon}</span>}
                    {item.label}
                  </a>
                )
                : (
                  <span class='ns-breadcrumb__link'>
                    {item.icon && <span aria-hidden='true'>{item.icon}</span>}
                    {item.label}
                  </span>
                )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
