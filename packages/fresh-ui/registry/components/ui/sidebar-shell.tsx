import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { ComponentResult, Renderable } from '../../lib/public-types.ts';

/**
 * Sidebar navigation item metadata.
 */
export interface SidebarNavItem {
  /** Destination URL for the navigation item. */
  href: string;
  /** Visible navigation label. */
  label: string;
  /** Optional leading icon for the item. */
  icon?: Renderable;
  /** Enables prefix matching for nested routes. */
  matchPrefix?: boolean;
  /** Optional custom active-state predicate. */
  isActive?: (pathname: string) => boolean;
}

/**
 * Sidebar navigation section metadata.
 */
export interface SidebarNavSection {
  /** Optional section label rendered above the grouped items. */
  label?: string;
  /** Ordered items within the section. */
  items: readonly SidebarNavItem[];
}

interface SidebarShellProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
  pathname: string;
  navigation: readonly SidebarNavSection[];
  brand: Renderable;
  brandBadge?: Renderable;
  footer?: Renderable;
  topbarStart?: Renderable;
  topbarEnd?: Renderable;
  contentId?: string;
  navLabel?: string;
}

function isItemActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.isActive) {
    return item.isActive(pathname);
  }

  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}

function SidebarShellNavGroup(
  { label, items, pathname }: {
    label?: string;
    items: readonly SidebarNavItem[];
    pathname: string;
  },
): VNode {
  return (
    <div
      class='ns-dashboard__nav-group'
      data-part='nav-group'
      data-scope='sidebar'
      role='list'
    >
      {label && (
        <span
          class='ns-dashboard__nav-group-label'
          data-part='nav-group-label'
          data-scope='sidebar'
        >
          {label}
        </span>
      )}
      {items.map((item) => {
        const active = isItemActive(pathname, item);
        return (
          <a
            key={item.href}
            href={item.href}
            role='listitem'
            class={cn('ns-dashboard__nav-item')}
            data-state={active ? ('selected') : undefined}
            data-part='nav-item'
            data-scope='sidebar'
            aria-current={active ? 'page' : undefined}
          >
            {item.icon && (
              <span
                class='ns-dashboard__nav-icon'
                data-part='nav-icon'
                data-scope='sidebar'
                aria-hidden='true'
              >
                {item.icon}
              </span>
            )}
            <span class='ns-dashboard__nav-label' data-part='nav-label' data-scope='sidebar'>
              {item.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Renders the shared dashboard sidebar shell with navigation and topbar slots.
 */
export function SidebarShell(
  {
    children,
    class: className,
    pathname,
    navigation,
    brand,
    brandBadge,
    footer,
    topbarStart,
    topbarEnd,
    contentId = 'main-content',
    navLabel = 'Sidebar navigation',
    ...props
  }: SidebarShellProps,
): ComponentResult {
  return (
    <div
      {...props}
      class={cn('ns-dashboard', className)}
      data-part='root'
      data-scope='app-shell'
    >
      <div
        class='ns-dashboard__sidebar-backdrop'
        data-part='sidebar-backdrop'
        data-scope='app-shell'
        data-sidebar-backdrop
        aria-hidden='true'
      />

      <aside
        class='ns-dashboard__sidebar'
        data-part='root'
        data-scope='sidebar'
        data-sidebar
      >
        <div
          class='ns-dashboard__sidebar-header'
          data-part='sidebar-header'
          data-scope='sidebar'
        >
          <div class='ns-dashboard__brand-group' data-part='brand-group' data-scope='sidebar'>
            {brand}
          </div>
          {brandBadge}
        </div>

        <nav
          class='ns-dashboard__sidebar-body'
          data-part='sidebar-body'
          data-scope='sidebar'
          aria-label={navLabel}
        >
          {navigation.map((section, index) => (
            <div key={section.label ?? `section-${index}`}>
              {index > 0 && (
                <div
                  class='ns-dashboard__nav-divider'
                  data-part='nav-divider'
                  data-scope='sidebar'
                  role='separator'
                />
              )}
              <SidebarShellNavGroup
                label={section.label}
                items={section.items}
                pathname={pathname}
              />
            </div>
          ))}
        </nav>

        {footer && (
          <div
            class='ns-dashboard__sidebar-footer'
            data-part='sidebar-footer'
            data-scope='sidebar'
          >
            {footer}
          </div>
        )}
      </aside>

      <div class='ns-dashboard__main' data-part='main' data-scope='app-shell'>
        <header class='ns-dashboard__topbar' data-part='root' data-scope='top-bar'>
          <div
            class='ns-dashboard__topbar-start'
            data-part='topbar-start'
            data-scope='top-bar'
          >
            {topbarStart}
          </div>
          <div class='ns-dashboard__topbar-end' data-part='topbar-end' data-scope='top-bar'>
            {topbarEnd}
          </div>
        </header>

        <main
          class='ns-dashboard__content'
          data-part='content'
          data-scope='app-shell'
          id={contentId}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
