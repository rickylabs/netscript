/**
 * @component NavigationMenu
 * @layer 2
 * @depends theme-seed location-marker
 * @description Native links and exclusive details disclosures for site navigation.
 */
import type { JSX, VNode } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';
import { LocationMarker } from './location-marker.tsx';

export interface NavigationMenuLink {
  id: string;
  href: string;
  title: string;
  description?: string;
  current?: boolean;
}
export interface NavigationMenuItem {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
  links?: readonly NavigationMenuLink[];
}
export interface NavigationMenuProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class'> {
  label: string;
  items: readonly NavigationMenuItem[];
  class?: string;
}

/** Native details work before hydration; an island adds Escape, focus-exit dismissal. */
export function NavigationMenu(
  { label, items, class: className, ...props }: NavigationMenuProps,
): VNode {
  const id = useId(), root = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const sync = () =>
    setOpened(
      root.current?.querySelector<HTMLDetailsElement>('details[open]')?.dataset.navId ?? null,
    );
  const close = (restore = false) => {
    const details = root.current?.querySelector<HTMLDetailsElement>('details[open]');
    if (details) {
      details.open = false;
      if (restore) details.querySelector('summary')?.focus();
    }
    sync();
  };
  return (
    <nav
      {...props}
      ref={root}
      aria-label={label}
      class={cn('ns-navigation-menu', className)}
      data-scope='navigation-menu'
      data-part='root'
      data-open={String(opened !== null)}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (
          !event.defaultPrevented && event.key === 'Escape' &&
          root.current?.querySelector('details[open]')
        ) {
          event.preventDefault();
          close(true);
        }
      }}
      onFocusOut={(event) => {
        props.onFocusOut?.(event);
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) close();
      }}
    >
      <ul data-scope='navigation-menu' data-part='list'>
        {items.map((item) => (
          <li key={item.id}>
            {item.links?.length
              ? (
                <details name={id} data-nav-id={item.id} onToggle={sync}>
                  <summary
                    data-scope='navigation-menu'
                    data-part='item'
                    data-trigger='menu'
                    data-state={opened === item.id ? 'open' : item.current ? 'selected' : 'rest'}
                    aria-current={item.current ? 'true' : undefined}
                  >
                    {item.current && (
                      <span data-scope='navigation-menu' data-part='marker'>
                        <LocationMarker />
                      </span>
                    )}
                    <span data-scope='navigation-menu' data-part='label'>{item.label}</span>
                    <span data-scope='navigation-menu' data-part='chevron' aria-hidden='true'>
                      ⌄
                    </span>
                  </summary>
                  <div data-scope='navigation-menu' data-part='viewport'>
                    <span data-scope='navigation-menu' data-part='indicator' aria-hidden='true' />
                    {item.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        aria-current={link.current ? 'page' : undefined}
                        data-scope='navigation-menu'
                        data-part='link'
                      >
                        <span data-scope='navigation-menu' data-part='title'>{link.title}</span>
                        {link.description && (
                          <span data-scope='navigation-menu' data-part='description'>
                            {link.description}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </details>
              )
              : (
                <a
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  data-scope='navigation-menu'
                  data-part='item'
                  data-trigger='link'
                  data-state={item.current ? 'selected' : 'rest'}
                >
                  {item.current && (
                    <span data-scope='navigation-menu' data-part='marker'>
                      <LocationMarker />
                    </span>
                  )}
                  <span data-scope='navigation-menu' data-part='label'>{item.label}</span>
                </a>
              )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
