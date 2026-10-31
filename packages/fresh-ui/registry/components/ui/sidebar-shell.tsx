import type { JSX } from 'preact';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Dialog } from '@netscript/fresh-ui/interactive';
import type { DialogRootProps } from '@netscript/fresh-ui/interactive';
import { cn } from '../../lib/cn.ts';
import type { ComponentResult, Renderable } from '../../lib/public-types.ts';
import { SidebarNavigation } from '../../lib/sidebar-navigation.tsx';
import type { SidebarNavSection } from '../../lib/sidebar-navigation.tsx';
import { announceSidebarState, SIDEBAR_EVENTS, sidebarRequest } from '../../lib/sidebar-events.ts';
export type { SidebarNavItem, SidebarNavSection } from '../../lib/sidebar-navigation.tsx';

const TABLET_QUERY = '(max-width: 1024px)';
const MOBILE_QUERY = '(max-width: 640px)';
type DialogOpenChangeReason = Parameters<NonNullable<DialogRootProps['onOpenChange']>>[1]['reason'];
type Breakpoint = 'desktop' | 'tablet' | 'mobile';

/** One app/sidebar/topbar family with a useful native SSR fallback. */
export interface SidebarShellProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Main content; also the default chat thread. */
  children: Renderable;
  class?: string;
  /** Current app path used only for destination matching. */
  pathname: string;
  /** App-owned information architecture; functions require a shared island boundary. */
  navigation: readonly SidebarNavSection[];
  brand: Renderable;
  brandBadge?: Renderable;
  footer?: Renderable;
  topbarStart?: Renderable;
  topbarEnd?: Renderable;
  topbarBrand?: Renderable;
  contentId?: string;
  navLabel?: string;
  /** Dashboard/app, bounded chat, or full-width docs header geometry. */
  layout?: 'dashboard' | 'chat' | 'docs';
  /** Desktop navigation presentation; none also removes mobile controls. */
  sidebar?: 'expanded' | 'collapsed' | 'none';
  /** false aliases sidebar=none. */
  nav?: boolean;
  sidebarVariant?: 'sidebar' | 'floating' | 'inset';
  /** Show the desktop rail and its explicitly supplied mobile path. */
  rail?: boolean;
  railContent?: Renderable;
  mobileRailContent?: Renderable;
  session?: Renderable;
  thread?: Renderable;
  composer?: Renderable;
  /** Accepted hydrated mobile modal state; static native disclosure is uncontrolled. */
  sidebarOpen?: boolean;
  /** Initial hydrated mobile modal state. */
  defaultSidebarOpen?: boolean;
  /** Native proposals; accept false/native-close to keep a platform-forced close closed. */
  onSidebarOpenChange?: (open: boolean, details: { reason: DialogOpenChangeReason }) => void;
}

/** Preserve server composition and independent-toggle islands, or hydrate the whole shell. */
export function SidebarShell({
  children,
  class: className,
  pathname,
  navigation,
  brand,
  brandBadge,
  footer,
  topbarStart,
  topbarEnd,
  topbarBrand,
  contentId = 'main-content',
  navLabel = 'Sidebar navigation',
  layout = 'dashboard',
  sidebar = 'expanded',
  nav = true,
  sidebarVariant = 'sidebar',
  rail = false,
  railContent,
  mobileRailContent,
  session,
  thread,
  composer,
  sidebarOpen,
  defaultSidebarOpen = false,
  onSidebarOpenChange,
  ...props
}: SidebarShellProps): ComponentResult {
  const generatedId = useId();
  const sidebarId = `ns-sidebar-${generatedId}`;
  const root = useRef<HTMLDivElement>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>();
  const [localOpen, setLocalOpen] = useState(defaultSidebarOpen);
  const pendingFocus = useRef<{ href: string | null } | null>(null);
  const hasNav = nav && sidebar !== 'none';
  const mobile = breakpoint !== undefined && breakpoint !== 'desktop';
  const open = sidebarOpen ?? localOpen;
  const changeOpen = useCallback((next: boolean, details: { reason: DialogOpenChangeReason }) => {
    if (sidebarOpen === undefined) setLocalOpen(next);
    onSidebarOpenChange?.(next, details);
    // A forced native close must update an isolated toggle without scheduling a controlled reopen.
    if (details.reason === 'native-close' && root.current) announceSidebarState(root.current);
  }, [onSidebarOpenChange, sidebarOpen]);

  useLayoutEffect(() => {
    const tablet = globalThis.matchMedia(TABLET_QUERY);
    const small = globalThis.matchMedia(MOBILE_QUERY);
    let current: Breakpoint | undefined;
    const update = () => {
      const next = small.matches ? 'mobile' : tablet.matches ? 'tablet' : 'desktop';
      if (next === current) return;
      const active = document.activeElement;
      if (
        (current === undefined || (current === 'desktop') !== (next === 'desktop')) &&
        active instanceof HTMLElement && root.current?.contains(active) &&
        active.closest('.ns-dashboard__sidebar, .ns-dashboard__drawer')
      ) {
        pendingFocus.current = { href: active.closest('a')?.getAttribute('href') ?? null };
      }
      current = next;
      setBreakpoint(next);
    };
    update();
    tablet.addEventListener('change', update);
    small.addEventListener('change', update);
    return () => {
      tablet.removeEventListener('change', update);
      small.removeEventListener('change', update);
    };
  }, []);

  useLayoutEffect(() => {
    if (!pendingFocus.current || !root.current) return;
    const { href } = pendingFocus.current;
    pendingFocus.current = null;
    const element = root.current;
    let canceled = false;
    // Child toggle layout effects settle its controls target before choosing a visible trigger.
    queueMicrotask(() => {
      if (canceled || !element.isConnected || root.current !== element) return;
      const links = [...element.querySelectorAll<HTMLAnchorElement>('aside[data-sidebar] a[href]')];
      const link = links.find((item) => item.getAttribute('href') === href) ?? links[0];
      const trigger = [...element.querySelectorAll<HTMLButtonElement>(
        '.ns-dashboard__topbar button[aria-controls]:not(:disabled)',
      )].find((button) => button.getClientRects().length > 0);
      if (breakpoint === 'desktop' || open) link?.focus();
      else trigger?.focus();
    });
    return () => {
      canceled = true;
    };
  }, [breakpoint, open]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const request = (event: Event) => {
      if (event.target !== element) return;
      const next = sidebarRequest(event);
      if (next !== undefined && hasNav && mobile) changeOpen(next, { reason: 'programmatic' });
    };
    const navigation = () => {
      if (mobile && open) changeOpen(false, { reason: 'programmatic' });
    };
    element.addEventListener(SIDEBAR_EVENTS.request, request);
    globalThis.addEventListener('popstate', navigation);
    return () => {
      element.removeEventListener(SIDEBAR_EVENTS.request, request);
      globalThis.removeEventListener('popstate', navigation);
    };
  }, [changeOpen, hasNav, mobile, open]);

  useEffect(() => {
    if (root.current) announceSidebarState(root.current);
  });

  const navigationProps = {
    pathname,
    navigation,
    brand,
    brandBadge,
    footer,
    navLabel,
    collapsed: !mobile && sidebar === 'collapsed',
    variant: sidebarVariant,
    offcanvas: mobile,
    onNavigate: mobile ? () => changeOpen(false, { reason: 'programmatic' }) : undefined,
  };
  const disclosure = breakpoint === undefined;
  return (
    <Dialog.Root id={sidebarId} open={hasNav && mobile && open} onOpenChange={changeOpen}>
      <div
        {...props}
        ref={(element) => {
          root.current = element;
          if (typeof props.ref === 'function') props.ref(element);
          else if (props.ref) props.ref.current = element;
        }}
        class={cn('ns-dashboard', className)}
        data-part='root'
        data-scope='app-shell'
        data-layout={layout}
        data-breakpoint={breakpoint}
        data-nav={hasNav ? 'true' : 'false'}
        data-rail={rail ? 'true' : 'false'}
        data-sidebar-presentation={hasNav ? sidebar : 'none'}
        data-sidebar-mode={disclosure ? 'static' : 'hydrated'}
      >
        {hasNav && (disclosure
          ? (
            <details
              id={sidebarId}
              open
              class='ns-dashboard__disclosure'
              data-scope='app-shell'
              data-part='sidebar-disclosure'
            >
              <summary
                class='ns-dashboard__summary'
                data-scope='app-shell'
                data-part='sidebar-summary'
              >
                {navLabel}
              </summary>
              <SidebarNavigation {...navigationProps} />
            </details>
          )
          : mobile
          ? (
            <Dialog.Content class='ns-dashboard__drawer'>
              <Dialog.Title class='ns-dashboard__visually-hidden'>{navLabel}</Dialog.Title>
              <Dialog.Description class='ns-dashboard__visually-hidden'>
                Choose a destination or close navigation.
              </Dialog.Description>
              <Dialog.Close class='ns-dashboard__drawer-close' aria-label='Close sidebar'>
                ×
              </Dialog.Close>
              <SidebarNavigation {...navigationProps} />
            </Dialog.Content>
          )
          : <SidebarNavigation {...navigationProps} id={sidebarId} />)}
        <header
          class='ns-dashboard__topbar'
          data-scope='top-bar'
          data-part='root'
          data-variant={layout === 'docs' ? 'docs' : 'app'}
          data-breakpoint={breakpoint === undefined ? undefined : mobile ? 'mobile' : 'desktop'}
        >
          <div class='ns-dashboard__topbar-start' data-scope='top-bar' data-part='topbar-start'>
            {hasNav && mobile && (
              <Dialog.Trigger
                class='ns-dashboard__mobile-trigger ns-dashboard__builtin-trigger'
                aria-label='Open sidebar'
              >
                ☰
              </Dialog.Trigger>
            )}
            {topbarBrand && (
              <div class='ns-dashboard__topbar-brand' data-scope='top-bar' data-part='brand'>
                {topbarBrand}
              </div>
            )}
            {topbarStart}
          </div>
          <div class='ns-dashboard__topbar-end' data-scope='top-bar' data-part='topbar-end'>
            {topbarEnd}
          </div>
        </header>
        <div class='ns-dashboard__main' data-scope='app-shell' data-part='main'>
          <main
            class='ns-dashboard__content'
            data-scope='app-shell'
            data-part='content'
            id={contentId}
          >
            {layout === 'chat'
              ? (
                <>
                  {session && (
                    <div class='ns-dashboard__session' data-scope='app-shell' data-part='session'>
                      {session}
                    </div>
                  )}
                  <div
                    class='ns-dashboard__thread'
                    data-scope='app-shell'
                    data-part='thread'
                    tabIndex={0}
                    role='region'
                    aria-label='Conversation'
                  >
                    {thread ?? children}
                  </div>
                  {composer && (
                    <div class='ns-dashboard__composer' data-scope='app-shell' data-part='composer'>
                      {composer}
                    </div>
                  )}
                </>
              )
              : children}
          </main>
          {rail && (
            <>
              <aside
                class='ns-dashboard__rail'
                data-scope='app-shell'
                data-part='rail'
                aria-label='On this page'
              >
                {railContent}
              </aside>
              <div class='ns-dashboard__mobile-rail' data-scope='app-shell' data-part='mobile-rail'>
                {mobileRailContent}
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog.Root>
  );
}
