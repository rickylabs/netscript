/**
 * @component MessageScroller
 * @layer 2
 * @depends theme-seed, cn
 * @description Native message viewport that follows growth only while pinned.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Available native scroll directions from the current position. */
export type MessageScrollability = 'none' | 'up' | 'down' | 'both';
const DEFAULT_END_THRESHOLD = 1;
const DEFAULT_SCROLL_LABEL = 'Scroll to latest';
const NATIVE_SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

/** Caller supplies a finite height or a constrained parent, plus an accessible name. */
export interface MessageScrollerProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  label: string;
  children?: ComponentChildren;
  followEnd?: boolean;
  endThreshold?: number;
  scrollLabel?: string;
  class?: string;
}

/** Native scroll position, anchoring and child focus remain browser-owned. */
function MessageScrollerRoot({
  label,
  children,
  followEnd = true,
  endThreshold = DEFAULT_END_THRESHOLD,
  scrollLabel = DEFAULT_SCROLL_LABEL,
  class: className,
  ...props
}: MessageScrollerProps): VNode {
  if (!label.trim()) throw new TypeError('MessageScroller label must name the native viewport');
  if (!Number.isFinite(endThreshold) || endThreshold < 0) {
    throw new TypeError('MessageScroller endThreshold must be finite and nonnegative');
  }
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const pinned = useRef(followEnd);
  const [scrollable, setScrollable] = useState<MessageScrollability>('none');
  const refresh = useRef<(() => void) | undefined>();
  const latest = () => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'instant' });
    pinned.current = true;
    refresh.current?.();
  };
  useLayoutEffect(() => {
    const view = viewport.current;
    const body = content.current;
    if (!view || !body) return;
    let frame: number | undefined;
    let readerIntent = false;
    let measuredScrollHeight = view.scrollHeight;
    let measuredClientHeight = view.clientHeight;
    const measure = (follow: boolean) => {
      if (follow && followEnd && pinned.current && !readerIntent) {
        view.scrollTo({ top: view.scrollHeight, behavior: 'instant' });
      }
      const up = view.scrollTop > endThreshold;
      const down = view.scrollHeight - view.clientHeight - view.scrollTop > endThreshold;
      pinned.current = !down;
      measuredScrollHeight = view.scrollHeight;
      measuredClientHeight = view.clientHeight;
      readerIntent = false;
      setScrollable(up ? (down ? 'both' : 'up') : down ? 'down' : 'none');
    };
    const schedule = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        measure(true);
      });
    };
    const scroll = () => {
      const geometryChanged = view.scrollHeight !== measuredScrollHeight ||
        view.clientHeight !== measuredClientHeight;
      // Native anchoring can scroll during growth before the observer frame.
      if (pinned.current && geometryChanged && !readerIntent) {
        schedule();
        return;
      }
      measure(false);
    };
    const noteIntent = () => {
      readerIntent = true;
      schedule();
    };
    const keyIntent = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !NATIVE_SCROLL_KEYS.has(event.key)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input,textarea,select,[contenteditable]')) {
        return;
      }
      if (event.key === ' ' && target instanceof Element && target.closest('button,a')) return;
      noteIntent();
    };
    if (!initialized.current) {
      initialized.current = true;
      if (followEnd) view.scrollTo({ top: view.scrollHeight, behavior: 'instant' });
    }
    measure(false);
    refresh.current = schedule;
    view.addEventListener('scroll', scroll, { passive: true });
    for (const type of ['wheel', 'pointerdown', 'touchstart']) {
      view.addEventListener(type, noteIntent, { passive: true });
    }
    view.addEventListener('keydown', keyIntent);
    const resize = new ResizeObserver(schedule);
    resize.observe(view);
    resize.observe(body);
    const mutation = new MutationObserver(schedule);
    mutation.observe(body, { childList: true, subtree: true, characterData: true });
    return () => {
      refresh.current = undefined;
      view.removeEventListener('scroll', scroll);
      for (const type of ['wheel', 'pointerdown', 'touchstart']) {
        view.removeEventListener(type, noteIntent);
      }
      view.removeEventListener('keydown', keyIntent);
      resize.disconnect();
      mutation.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [followEnd, endThreshold]);
  const below = scrollable === 'down' || scrollable === 'both';
  return (
    <div
      {...props}
      class={cn('ns-message-scroller', className)}
      data-scope='message-scroller'
      data-part='root'
      data-scrollable={scrollable}
    >
      <div
        ref={viewport}
        id={id + '-viewport'}
        class='ns-message-scroller__viewport'
        data-scope='message-scroller'
        data-part='viewport'
        role='region'
        aria-label={label}
        tabIndex={0}
      >
        <div ref={content} data-scope='message-scroller' data-part='content'>{children}</div>
      </div>
      <button
        type='button'
        class='ns-message-scroller__latest'
        data-scope='message-scroller'
        data-part='scroll-button'
        aria-label={scrollLabel}
        aria-controls={id + '-viewport'}
        aria-disabled={below ? 'false' : 'true'}
        onClick={() => {
          if (below) latest();
        }}
      >
        <Icon name='arrow-right' size={14} class='ns-message-scroller__arrow' />
      </button>
    </div>
  );
}

/** Optional native message boundary; content semantics belong to its caller. */
function MessageItem(
  { class: className, children, ...props }: Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
  },
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-message-scroller__item', className)}
      data-scope='message-scroller'
      data-part='item'
    >
      {children}
    </div>
  );
}

/** Independently owned native viewport with pinned-only following. */
export const MessageScroller: ((props: MessageScrollerProps) => VNode) & {
  Item: typeof MessageItem;
} = Object.assign(MessageScrollerRoot, { Item: MessageItem });
