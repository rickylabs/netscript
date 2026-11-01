/**
 * @component Toc
 * @layer 2
 * @depends theme-seed
 * @description Native document outline with an optional mobile disclosure.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';
import {
  sectionId,
  SectionNavigationContext,
  type SectionNavigationOptions,
  useSectionNavigation,
} from '../../lib/section-navigation.ts';

const MOBILE_QUERY = '(max-width: 767px)';
const ITEM_SELECTOR = 'a[data-scope="toc"][data-part="item"]';

/** Responsive hooks run within the caller's island; forced mobile also works as native SSR. */
export interface TocProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class'>, SectionNavigationOptions {
  children: ComponentChildren;
  links?: ComponentChildren;
  label?: string;
  breakpoint?: 'desktop' | 'mobile';
  class?: string;
}

/** Current is root-owned; state only forces a rest/hover preview. */
export interface TocItemProps extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'class'> {
  href: string;
  children: ComponentChildren;
  level?: '2' | '3';
  state?: 'rest' | 'hover';
  class?: string;
}

/** Ordinary anchors retain native hash scrolling and keyboard behavior. */
function TocItem(
  { href, children, level = '2', state = 'rest', class: className, ...props }: TocItemProps,
): VNode {
  const navigation = useContext(SectionNavigationContext);
  const id = sectionId(href, navigation.baseUrl);
  const current = id !== null && id === navigation.currentId;
  return (
    <a
      {...props}
      href={href}
      class={cn('ns-toc__item', className)}
      data-scope='toc'
      data-part='item'
      data-level={level}
      data-state={current ? 'current' : state}
      aria-current={current ? 'location' : undefined}
    >
      {current && <span data-scope='toc' data-part='marker' aria-hidden='true' />}
      {children}
    </a>
  );
}

/** One active outline branch avoids duplicate caller IDs and hidden focusable links. */
function TocRoot({
  children,
  links,
  label = 'On this page',
  breakpoint,
  currentId,
  defaultCurrentId,
  onCurrentChange,
  observe = false,
  class: className,
  ...props
}: TocProps): VNode {
  const root = useRef<HTMLElement>(null);
  const [measured, setMeasured] = useState<'desktop' | 'mobile'>('desktop');
  const pendingFocus = useRef<{ href: string | null }>();
  const view = breakpoint ?? measured;
  const navigation = useSectionNavigation(root, ITEM_SELECTOR, {
    currentId,
    defaultCurrentId,
    onCurrentChange,
    observe,
  });
  useLayoutEffect(() => {
    if (breakpoint !== undefined) return;
    const media = matchMedia(MOBILE_QUERY);
    let previous = 'desktop';
    const update = () => {
      const next = media.matches ? 'mobile' : 'desktop';
      if (next === previous) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.current?.contains(active)) {
        pendingFocus.current = { href: active.closest('a')?.getAttribute('href') ?? null };
      }
      previous = next;
      setMeasured(next);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = undefined;
    if (!pending || !root.current) return;
    const links = [...root.current.querySelectorAll<HTMLAnchorElement>(ITEM_SELECTOR)];
    const destination = view === 'mobile'
      ? root.current.querySelector<HTMLElement>('summary')
      : links.find((link) => link.getAttribute('href') === pending.href) ?? links[0];
    destination?.focus();
  }, [view]);

  const content = (
    <>
      <div class='ns-toc__rail' data-scope='toc' data-part='rail'>{children}</div>
      {links != null && <div class='ns-toc__links' data-scope='toc' data-part='links'>{links}</div>}
    </>
  );
  return (
    <SectionNavigationContext.Provider value={navigation}>
      <nav
        {...props}
        ref={(element) => {
          root.current = element;
          if (typeof props.ref === 'function') props.ref(element);
          else if (props.ref) props.ref.current = element;
        }}
        aria-label={label}
        class={cn('ns-toc', className)}
        data-scope='toc'
        data-part='root'
        data-breakpoint={view}
        data-state={undefined}
        data-level={undefined}
      >
        {view === 'mobile'
          ? (
            <details>
              <summary class='ns-toc__summary'>
                <span data-scope='toc' data-part='eyebrow'>{label}</span>
                <span class='ns-toc__current' data-scope='toc' data-part='current'>
                  {navigation.currentLabel && navigation.currentId !== null &&
                    <span data-scope='toc' data-part='marker' aria-hidden='true' />}
                  <span>{navigation.currentLabel || label}</span>
                </span>
                <span data-scope='toc' data-part='chevron-down' aria-hidden='true'>
                  <Icon name='chevron-down' size={14} />
                </span>
              </summary>
              {content}
            </details>
          )
          : (
            <>
              <div class='ns-toc__eyebrow' data-scope='toc' data-part='eyebrow'>{label}</div>
              {content}
            </>
          )}
      </nav>
    </SectionNavigationContext.Provider>
  );
}

/** Document outline with native Item links and a mobile details disclosure. */
export const Toc: ((props: TocProps) => VNode) & { Item: typeof TocItem } = Object.assign(
  TocRoot,
  { Item: TocItem },
);
