import { type Context, createContext, type RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** Native location and passive geometry are proposals, never imperative navigation. */
export type SectionChangeReason = 'hash' | 'scroll';

/** Shared accepted-current ports for the two copied document navigation components. */
export interface SectionNavigationOptions {
  currentId?: string | null;
  defaultCurrentId?: string | null;
  onCurrentChange?: (id: string, details: { reason: SectionChangeReason }) => void;
  observe?: boolean;
}

/** A fragment is local only when its resolved path, origin and query match this document. */
export function sectionId(href: string, base?: string): string | null {
  let hash = href;
  if (!href.startsWith('#')) {
    if (!base) return null;
    try {
      const url = new URL(href, base);
      const document = new URL(base);
      if (
        url.origin !== document.origin || url.pathname !== document.pathname ||
        url.search !== document.search
      ) return null;
      hash = url.hash;
    } catch {
      return null;
    }
  }
  try {
    return hash.length > 1 ? decodeURIComponent(hash.slice(1)) : null;
  } catch {
    return null;
  }
}

/** Root-owned state is shared with native links without cloning caller children. */
export interface SectionNavigationState {
  currentId: string | null;
  currentLabel: string;
  baseUrl?: string;
  scrolled: boolean;
}

/** Each root supplies its own nearest context; nested navigations remain independent. */
export const SectionNavigationContext: Context<SectionNavigationState> = createContext<
  SectionNavigationState
>({
  currentId: null,
  currentLabel: '',
  scrolled: false,
});

/** Find the native scrollport used by fragment scrolling; document scrolling stays on the viewport. */
function scrollport(target: HTMLElement): HTMLElement {
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent === document.body || parent === document.documentElement) break;
    const overflow = getComputedStyle(parent).overflowY;
    if (
      overflow !== 'visible' && overflow !== 'clip' &&
      parent.scrollHeight > parent.clientHeight + 1
    ) return parent;
  }
  return document.documentElement;
}

/** Physical viewport bounds include the scrollport's own border, never an invented offset. */
function scrollBounds(port: HTMLElement): { top: number; bottom: number; end: boolean } {
  const viewport = port === document.documentElement;
  const top = viewport ? 0 : port.getBoundingClientRect().top + port.clientTop;
  const extent = viewport ? innerHeight : port.clientHeight;
  const scrolling = viewport ? document.scrollingElement ?? port : port;
  return {
    top,
    bottom: top + extent,
    end: scrolling.scrollHeight - extent - scrolling.scrollTop <= 1,
  };
}

/** Track actual local targets while leaving hash changes, focus and disclosure state to the platform. */
export function useSectionNavigation(
  root: RefObject<HTMLElement>,
  selector: string,
  options: SectionNavigationOptions,
): SectionNavigationState {
  const [local, setLocal] = useState(options.defaultCurrentId ?? null);
  const currentId = options.currentId === undefined ? local : options.currentId;
  const [presentation, setPresentation] = useState<{
    currentLabel: string;
    measuredId: string | null;
    scrolled: boolean;
  }>({ currentLabel: '', measuredId: null, scrolled: false });
  const [baseUrl, setBaseUrl] = useState<string>();
  const latest = useRef({ ...options, currentId, controlled: options.currentId !== undefined });
  latest.current = { ...options, currentId, controlled: options.currentId !== undefined };
  const refresh = useRef<() => void>();

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    setBaseUrl(document.baseURI);
    let frame = 0;
    let disposed = false;
    let lastProposal: string | null = null;
    let lastAccepted = latest.current.currentId;
    let targets: { id: string; link: HTMLAnchorElement; target: HTMLElement }[] = [];
    let watched = new Set<HTMLElement>();
    // A nested outline owns its own links, even when it uses the same component scope.
    const ownLinks = () =>
      [...element.querySelectorAll<HTMLAnchorElement>(selector)].filter(
        (link) => link.closest('nav, [role="navigation"]') === element,
      );
    const sizes = new ResizeObserver(() => schedule());
    const propose = (id: string, reason: SectionChangeReason) => {
      const accepted = latest.current.currentId;
      if (accepted !== lastAccepted) {
        lastAccepted = accepted;
        lastProposal = null;
      }
      if (id === accepted) {
        lastProposal = null;
        return;
      }
      if (id === lastProposal) return;
      lastProposal = id;
      if (!latest.current.controlled) setLocal(id);
      latest.current.onCurrentChange?.(id, { reason });
    };
    const discover = () => {
      const next: typeof targets = [];
      const ids = new Set<string>();
      for (const link of ownLinks()) {
        const id = sectionId(link.getAttribute('href') ?? '', document.baseURI);
        const target = id === null ? null : document.getElementById(id);
        if (id && target && !ids.has(id)) {
          ids.add(id);
          next.push({ id, link, target });
        }
      }
      // A non-scrolling ancestor can become the scrollport without replacing a heading or nav node.
      const ancestors = new Set<HTMLElement>();
      for (const node of [element, ...next.map((entry) => entry.target)]) {
        for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
          ancestors.add(parent);
        }
      }
      if (ancestors.size !== watched.size || [...ancestors].some((node) => !watched.has(node))) {
        sizes.disconnect();
        for (const node of ancestors) sizes.observe(node);
        watched = ancestors;
      }
      targets = next;
    };
    const update = () => {
      frame = 0;
      if (disposed) return;
      discover();
      if (options.observe && targets.length) {
        let candidate = targets[0];
        for (const entry of targets) {
          const port = scrollport(entry.target);
          const bounds = scrollBounds(port);
          const box = entry.target.getBoundingClientRect();
          const paddingValue = getComputedStyle(port).scrollPaddingBlockStart;
          const paddingNumber = parseFloat(paddingValue) || 0;
          // Computed percentages retain their unit and resolve against this scrollport's block extent.
          const padding = paddingValue.endsWith('%')
            ? paddingNumber * (bounds.bottom - bounds.top) / 100
            : paddingNumber;
          const margin = parseFloat(getComputedStyle(entry.target).scrollMarginBlockStart) || 0;
          if (
            box.top <= bounds.top + padding + margin + 1 ||
            (bounds.end && box.bottom > bounds.top && box.top < bounds.bottom)
          ) candidate = entry;
        }
        propose(candidate.id, 'scroll');
      }
      const accepted = latest.current.currentId;
      const link = accepted === null
        ? undefined
        : ownLinks().find((link) =>
          sectionId(link.getAttribute('href') ?? '', document.baseURI) === accepted
        );
      const port = scrollport(element);
      const bounds = scrollBounds(port);
      const inset = parseFloat(getComputedStyle(element).top) || 0;
      const navBox = element.getBoundingClientRect();
      const next = {
        currentLabel: link?.textContent?.trim() ?? '',
        measuredId: accepted,
        scrolled: options.observe === true && targets.length > 0 &&
          accepted !== null && accepted !== targets[0].id &&
          navBox.height > 0 && navBox.bottom > bounds.top && navBox.top < bounds.bottom &&
          Math.abs(navBox.top - bounds.top - inset) <= 1,
      };
      setPresentation((previous) =>
        previous.currentLabel === next.currentLabel && previous.measuredId === next.measuredId &&
          previous.scrolled === next.scrolled
          ? previous
          : next
      );
    };
    function schedule() {
      if (!frame && !disposed) frame = requestAnimationFrame(update);
    }
    const hash = () => {
      discover();
      const id = sectionId(location.hash);
      if (id && targets.some((entry) => entry.id === id)) propose(id, 'hash');
      schedule();
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['id', 'href', 'style', 'class', 'dir'],
    });
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    globalThis.addEventListener('resize', schedule, { passive: true });
    globalThis.addEventListener('hashchange', hash);
    globalThis.addEventListener('popstate', hash);
    refresh.current = schedule;
    hash();
    return () => {
      disposed = true;
      refresh.current = undefined;
      if (frame) cancelAnimationFrame(frame);
      sizes.disconnect();
      mutations.disconnect();
      document.removeEventListener('scroll', schedule, true);
      globalThis.removeEventListener('resize', schedule);
      globalThis.removeEventListener('hashchange', hash);
      globalThis.removeEventListener('popstate', hash);
    };
  }, [root, selector, options.observe]);

  useEffect(() => refresh.current?.(), [currentId]);

  // DOM-derived text and pinning belong to the accepted ID that was measured, never a previous selection.
  const currentMeasurement = currentId !== null && presentation.measuredId === currentId;
  return {
    currentId,
    currentLabel: currentMeasurement ? presentation.currentLabel : '',
    scrolled: currentMeasurement && presentation.scrolled,
    baseUrl,
  };
}
