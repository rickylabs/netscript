import type { JSX, VNode } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../lib/cn.ts';
import type { Renderable } from '../lib/public-types.ts';
import {
  announceSidebarState,
  readSidebarState,
  SIDEBAR_EVENTS,
  SIDEBAR_SELECTORS,
} from '../lib/sidebar-events.ts';

/** Props for the registry sidebar toggle island. */
export interface SidebarToggleProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'children'> {
  class?: string;
  sidebarSelector?: string;
  backdropSelector?: string;
  openLabel?: string;
  closeLabel?: string;
  openIcon?: Renderable;
  closeIcon?: Renderable;
}

/** Control the nearest shell, or preserve explicit-selector legacy standalone behavior. */
export default function SidebarToggle({
  class: className,
  sidebarSelector = SIDEBAR_SELECTORS.sidebar,
  backdropSelector = SIDEBAR_SELECTORS.backdrop,
  openLabel = 'Open sidebar',
  closeLabel = 'Close sidebar',
  openIcon,
  closeIcon,
  ...props
}: SidebarToggleProps): VNode {
  const [open, setOpen] = useState(false);
  const [controls, setControls] = useState<string>();
  const button = useRef<HTMLButtonElement>(null);
  const owner = useRef<Element | null>(null);
  const defaults = sidebarSelector === SIDEBAR_SELECTORS.sidebar &&
    backdropSelector === SIDEBAR_SELECTORS.backdrop;

  useLayoutEffect(() => {
    const root = defaults ? button.current?.closest(SIDEBAR_SELECTORS.shell) : null;
    owner.current = root ?? null;
    if (!root) {
      setControls(undefined);
      setOpen(false);
      return;
    }
    const sync = () => {
      const state = readSidebarState(root);
      setControls(state?.controls);
      setOpen(state?.open ?? false);
    };
    const disclosure = root.querySelector<HTMLDetailsElement>(SIDEBAR_SELECTORS.disclosure);
    root.addEventListener(SIDEBAR_EVENTS.state, sync);
    disclosure?.addEventListener('toggle', sync);
    sync();
    return () => {
      root.removeEventListener(SIDEBAR_EVENTS.state, sync);
      disclosure?.removeEventListener('toggle', sync);
      owner.current = null;
    };
  }, [defaults]);

  useEffect(() => {
    if (owner.current) return;
    const sidebar = document.querySelector(sidebarSelector);
    const backdrop = document.querySelector(backdropSelector);
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    sidebar?.setAttribute('data-state', open ? 'open' : 'rest');
    backdrop?.setAttribute('data-state', open ? 'open' : 'rest');
    const previousOverflow = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', escape);
      backdrop?.addEventListener('click', close);
    }
    globalThis.addEventListener('popstate', close);
    return () => {
      document.removeEventListener('keydown', escape);
      backdrop?.removeEventListener('click', close);
      globalThis.removeEventListener('popstate', close);
      if (open) document.body.style.overflow = previousOverflow;
    };
  }, [backdropSelector, open, sidebarSelector]);

  return (
    <button
      {...props}
      ref={(element) => {
        button.current = element;
        if (typeof props.ref === 'function') props.ref(element);
        else if (props.ref) props.ref.current = element;
      }}
      type='button'
      class={cn(
        'ns-dashboard__mobile-trigger ns-btn',
        defaults && 'ns-dashboard__managed-toggle',
        className,
      )}
      data-variant='ghost'
      data-size='sm'
      data-icon='true'
      data-part='root'
      data-scope='sidebar-toggle'
      data-open={open ? 'true' : 'false'}
      data-state='rest'
      aria-controls={controls}
      aria-label={open ? closeLabel : openLabel}
      aria-expanded={open}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        const root = owner.current;
        if (!root) {
          setOpen((previous) => !previous);
          return;
        }
        const state = readSidebarState(root);
        if (!state) return;
        if (root.getAttribute('data-sidebar-mode') === 'static') {
          const details = root.querySelector<HTMLDetailsElement>(SIDEBAR_SELECTORS.disclosure);
          if (details) details.open = !details.open;
          announceSidebarState(root);
        } else {root.dispatchEvent(
            new CustomEvent(SIDEBAR_EVENTS.request, { detail: { open: !state.open } }),
          );}
      }}
    >
      <span aria-hidden='true' style={{ fontSize: '1.1rem', lineHeight: 1 }}>
        {open ? closeIcon ?? '✕' : openIcon ?? '☰'}
      </span>
    </button>
  );
}
