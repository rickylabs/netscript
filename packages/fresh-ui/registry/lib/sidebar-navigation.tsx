import type { JSX, VNode } from 'preact';
import type { Renderable } from './public-types.ts';

/** App-owned navigation metadata; callback predicates require a shared island boundary. */
export interface SidebarNavItem {
  /** Destination URL, omitted from the rendered link when disabled. */
  href: string;
  /** Visible and accessible navigation label. */
  label: string;
  /** Optional decorative leading icon. */
  icon?: Renderable;
  /** Match the destination and its nested routes. */
  matchPrefix?: boolean;
  /** Optional app-owned predicate; cannot be serialized across a Fresh island boundary. */
  isActive?: (pathname: string) => boolean;
  /** Indent a secondary navigation lane. */
  level?: 1 | 2;
  /** Keep this destination out of navigation and keyboard order. */
  disabled?: boolean;
  /** Optional informational count; never a second interactive control. */
  count?: Renderable;
  /** Show the selected-location marker; defaults to true. */
  marker?: boolean;
  /** Show a decorative trailing chevron; defaults to false. */
  chevron?: boolean;
}

/** Native navigation section, optionally disclosed with details/summary. */
export interface SidebarNavSection {
  /** Group heading; required and nonblank when collapsible. */
  label?: string;
  /** Ordered destinations. */
  items: readonly SidebarNavItem[];
  /** Render a native disclosure instead of an always-visible group. */
  collapsible?: boolean;
  /** Initial native disclosure state; defaults to true. */
  defaultOpen?: boolean;
}

/** Private source split for the single public SidebarShell family. */
export interface SidebarNavigationProps {
  pathname: string;
  navigation: readonly SidebarNavSection[];
  brand: Renderable;
  brandBadge?: Renderable;
  footer?: Renderable;
  navLabel: string;
  collapsed: boolean;
  variant: 'sidebar' | 'floating' | 'inset';
  offcanvas: boolean;
  onNavigate?: () => void;
}

function activeItem(pathname: string, item: SidebarNavItem): boolean {
  return !item.disabled && (item.isActive?.(pathname) ??
    (item.matchPrefix
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : pathname === item.href));
}

function NavItems(
  { items, pathname, collapsed, onNavigate }:
    & Pick<SidebarNavigationProps, 'pathname' | 'collapsed' | 'onNavigate'>
    & {
      items: readonly SidebarNavItem[];
    },
): VNode {
  return (
    <ul class='ns-dashboard__nav-list'>
      {items.map((item) => {
        const active = activeItem(pathname, item);
        return (
          <li key={item.href}>
            <a
              href={item.disabled ? undefined : item.href}
              aria-disabled={item.disabled ? 'true' : undefined}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              onClick={item.disabled ? undefined : onNavigate}
              class='ns-dashboard__nav-item'
              data-scope='sidebar'
              data-part='nav-item'
              data-state={item.disabled ? 'disabled' : active ? 'selected' : 'rest'}
              data-level={String(item.level ?? 1)}
              data-collapsed={collapsed ? 'true' : 'false'}
            >
              {active && item.marker !== false && (
                <span
                  class='ns-dashboard__nav-marker'
                  data-scope='sidebar'
                  data-part='marker'
                  aria-hidden='true'
                />
              )}
              {item.icon && (
                <span
                  class='ns-dashboard__nav-icon'
                  data-scope='sidebar'
                  data-part='nav-icon'
                  aria-hidden='true'
                >
                  {item.icon}
                </span>
              )}
              <span class='ns-dashboard__nav-label' data-scope='sidebar' data-part='nav-label'>
                {item.label}
              </span>
              {item.count !== undefined && (
                <span class='ns-dashboard__nav-count' data-scope='sidebar' data-part='count'>
                  {item.count}
                </span>
              )}
              {item.chevron && (
                <span
                  class='ns-dashboard__nav-chevron'
                  data-scope='sidebar'
                  data-part='chevron'
                  aria-hidden='true'
                >
                  ›
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** One native aside; no duplicated mobile/desktop destination trees. */
export function SidebarNavigation(
  {
    pathname,
    navigation,
    brand,
    brandBadge,
    footer,
    navLabel,
    collapsed,
    variant,
    offcanvas,
    onNavigate,
    ...props
  }: SidebarNavigationProps & JSX.HTMLAttributes<HTMLElement>,
): VNode {
  return (
    <aside
      {...props}
      class='ns-dashboard__sidebar'
      data-scope='sidebar'
      data-part='root'
      data-sidebar
      data-variant={variant}
      data-collapsible={offcanvas ? 'offcanvas' : collapsed ? 'icon' : 'expanded'}
    >
      <div class='ns-dashboard__sidebar-header' data-scope='sidebar' data-part='sidebar-header'>
        <div class='ns-dashboard__brand-group' data-scope='sidebar' data-part='brand-group'>
          {brand}
        </div>
        {brandBadge}
      </div>
      <nav
        class='ns-dashboard__sidebar-body'
        aria-label={navLabel}
        data-scope='sidebar'
        data-part='sidebar-body'
      >
        {navigation.map((section, index) => {
          const list = (
            <NavItems
              items={section.items}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
          if (section.collapsible && !section.label?.trim()) {
            throw new Error('Collapsible sidebar sections require a label.');
          }
          return (
            <div key={section.label ?? `section-${index}`}>
              {index > 0 && (
                <div
                  class='ns-dashboard__nav-divider'
                  data-scope='sidebar'
                  data-part='nav-divider'
                  role='separator'
                />
              )}
              {section.collapsible
                ? (
                  <details
                    class='ns-dashboard__nav-group'
                    data-scope='sidebar'
                    data-part='nav-group'
                    open={section.defaultOpen ?? true}
                  >
                    <summary
                      class='ns-dashboard__nav-group-label'
                      data-scope='sidebar'
                      data-part='nav-group-label'
                      aria-label={section.label}
                    >
                      {section.label}
                    </summary>
                    {list}
                  </details>
                )
                : (
                  <div
                    class='ns-dashboard__nav-group'
                    data-scope='sidebar'
                    data-part='nav-group'
                  >
                    {section.label && (
                      <span
                        class='ns-dashboard__nav-group-label'
                        data-scope='sidebar'
                        data-part='nav-group-label'
                      >
                        {section.label}
                      </span>
                    )}
                    {list}
                  </div>
                )}
            </div>
          );
        })}
      </nav>
      {footer && (
        <div class='ns-dashboard__sidebar-footer' data-scope='sidebar' data-part='sidebar-footer'>
          {footer}
        </div>
      )}
    </aside>
  );
}
