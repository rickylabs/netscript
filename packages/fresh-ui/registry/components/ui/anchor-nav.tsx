/**
 * @component AnchorNav
 * @layer 2
 * @depends theme-seed
 * @description Native horizontal section links with optional passive current tracking.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';
import {
  sectionId,
  SectionNavigationContext,
  type SectionNavigationOptions,
  useSectionNavigation,
} from '../../lib/section-navigation.ts';

/** Shared native nav ports; observation and a forced state are mutually exclusive. */
interface AnchorNavBaseProps
  extends
    Omit<JSX.HTMLAttributes<HTMLElement>, 'class'>,
    Omit<SectionNavigationOptions, 'observe'> {
  children: ComponentChildren;
  label?: string;
  class?: string;
}

/** Observe owns measured state; non-observed callers may supply a presentation snapshot. */
export type AnchorNavProps =
  & AnchorNavBaseProps
  & (
    | { observe: true; state?: never }
    | { observe?: false; state?: 'rest' | 'scrolled' }
  );

/** A native link, never a tab or a roving-focus item. */
export interface AnchorNavLinkProps
  extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'> {
  href: string;
  children: ComponentChildren;
  class?: string;
}

/** Root selection overrides illicit aria-current or style-axis attributes. */
function AnchorNavLink({ href, children, class: className, ...props }: AnchorNavLinkProps): VNode {
  const navigation = useContext(SectionNavigationContext);
  const id = sectionId(href, navigation.baseUrl);
  const current = id !== null && id === navigation.currentId;
  return (
    <a
      {...props}
      href={href}
      class={cn('ns-anchor-nav__link', className)}
      data-scope='anchor-nav'
      data-part='anchor'
      data-state={undefined}
      data-level={undefined}
      aria-current={current ? 'location' : undefined}
    >
      {current && <span data-scope='anchor-nav' data-part='marker' aria-hidden='true' />}
      {children}
    </a>
  );
}

/** Native CSS pins the bar; passive observation only reports the accepted current section. */
function AnchorNavRoot({
  children,
  label = 'Sections',
  class: className,
  currentId,
  defaultCurrentId,
  onCurrentChange,
  observe = false,
  state = 'rest',
  ...props
}: AnchorNavProps): VNode {
  const root = useRef<HTMLElement>(null);
  const navigation = useSectionNavigation(root, 'a[data-scope="anchor-nav"][data-part="anchor"]', {
    currentId,
    defaultCurrentId,
    onCurrentChange,
    observe,
  });
  return (
    <SectionNavigationContext.Provider value={navigation}>
      <nav
        {...props}
        ref={(element) => {
          root.current = element;
          if (typeof props.ref === 'function') props.ref(element);
          else if (props.ref) props.ref.current = element;
        }}
        class={cn('ns-anchor-nav', className)}
        aria-label={label}
        data-scope='anchor-nav'
        data-part='root'
        data-state={observe ? navigation.scrolled ? 'scrolled' : 'rest' : state}
        data-level={undefined}
      >
        {children}
      </nav>
    </SectionNavigationContext.Provider>
  );
}

/** Section navigation with native Link children and no application-tab key manager. */
export const AnchorNav: ((props: AnchorNavProps) => VNode) & { Link: typeof AnchorNavLink } = Object
  .assign(AnchorNavRoot, { Link: AnchorNavLink });
