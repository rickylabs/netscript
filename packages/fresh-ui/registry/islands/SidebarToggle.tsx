import type { JSX, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { cn } from '../lib/cn.ts';
import type { Renderable } from '../lib/public-types.ts';

/**
 * Props for the registry sidebar toggle island.
 */
export interface SidebarToggleProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'class' | 'children'> {
  class?: string;
  sidebarSelector?: string;
  backdropSelector?: string;
  openLabel?: string;
  closeLabel?: string;
  openIcon?: Renderable;
  closeIcon?: Renderable;
}

/**
 * Toggles the mobile dashboard sidebar and its backdrop state.
 * @param props Button, selector, and icon overrides for the toggle.
 * @returns A hydrated sidebar toggle button.
 */
export default function SidebarToggle({
  class: className,
  sidebarSelector = '[data-sidebar]',
  backdropSelector = '[data-sidebar-backdrop]',
  openLabel = 'Open sidebar',
  closeLabel = 'Close sidebar',
  openIcon,
  closeIcon,
  ...props
}: SidebarToggleProps): VNode {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const sidebar = document.querySelector(sidebarSelector);
    const backdrop = document.querySelector(backdropSelector);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    sidebar?.classList.toggle('is-open', open);
    backdrop?.classList.toggle('is-visible', open);

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
      backdrop?.addEventListener('click', close);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      backdrop?.removeEventListener('click', close);
      document.body.style.overflow = '';
    };
  }, [backdropSelector, close, open, sidebarSelector]);

  useEffect(() => {
    const handleNavigation = () => close();
    globalThis.addEventListener('popstate', handleNavigation);
    return () => globalThis.removeEventListener('popstate', handleNavigation);
  }, [close]);

  return (
    <button
      {...props}
      type='button'
      class={cn(
        'ns-dashboard__mobile-trigger ns-btn ns-btn--ghost ns-btn--icon ns-btn--sm',
        className,
      )}
      aria-label={open ? closeLabel : openLabel}
      aria-expanded={open}
      onClick={toggle}
    >
      <span aria-hidden='true' style={{ fontSize: '1.1rem', lineHeight: 1 }}>
        {open ? closeIcon ?? '✕' : openIcon ?? '☰'}
      </span>
    </button>
  );
}
