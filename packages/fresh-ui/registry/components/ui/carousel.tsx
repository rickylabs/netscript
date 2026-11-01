/**
 * @component Carousel
 * @layer 2
 * @depends theme-seed
 * @description Manual carousel using native overflow scrolling and snap points.
 */
import type { ComponentChildren, VNode } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

export interface CarouselSlide {
  readonly label: string;
  readonly content: ComponentChildren;
}
export interface CarouselProps {
  label: string;
  slides: readonly CarouselSlide[];
  orientation?: 'horizontal' | 'vertical';
  controls?: 'outside' | 'inside';
  dots?: boolean;
  counter?: boolean;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  class?: string;
}

function clampIndex(index: number, length: number): number {
  return Math.max(
    0,
    Math.min(Math.max(0, length - 1), Number.isFinite(index) ? Math.floor(index) : 0),
  );
}

/** No autoplay or synthetic gestures; aria-disabled keeps boundary activation focus stable. */
export function Carousel({
  label,
  slides,
  orientation = 'horizontal',
  controls = 'outside',
  dots = true,
  counter = false,
  defaultIndex = 0,
  onIndexChange,
  class: className,
}: CarouselProps): VNode {
  const id = useId(), viewport = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => clampIndex(defaultIndex, slides.length));
  const current = useRef(index), callback = useRef(onIndexChange);
  const [hydrated, setHydrated] = useState(false);
  callback.current = onIndexChange;
  const select = (next: number) => {
    const selected = clampIndex(next, slides.length);
    if (current.current === selected) return;
    const element = viewport.current, previous = element?.children[current.current];
    if (element && previous?.contains(element.ownerDocument.activeElement)) {
      element.focus({ preventScroll: true });
    }
    current.current = selected;
    setIndex(selected);
    callback.current?.(selected);
  };
  const align = (selected: number) => {
    const element = viewport.current, slide = element?.children[selected];
    if (!element || !(slide instanceof HTMLElement)) return;
    const frame = element.getBoundingClientRect(), target = slide.getBoundingClientRect();
    element.scrollBy({
      left: orientation === 'horizontal' ? target.left - frame.left : 0,
      top: orientation === 'vertical' ? target.top - frame.top : 0,
      behavior: 'instant',
    });
  };
  const go = (next: number) => {
    const selected = clampIndex(next, slides.length);
    select(selected);
    align(selected);
  };
  useLayoutEffect(() => {
    setHydrated(true);
    const selected = clampIndex(current.current, slides.length);
    if (selected !== current.current) {
      current.current = selected;
      setIndex(selected);
      callback.current?.(selected);
    }
    align(selected);
    const observer = new ResizeObserver(() => align(current.current));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [orientation, slides.length]);
  return (
    <section
      class={cn('ns-carousel', className)}
      role='region'
      aria-label={label}
      aria-roledescription='carousel'
      data-scope='carousel'
      data-part='root'
      data-orientation={orientation}
      data-controls={controls}
    >
      <button
        type='button'
        class='ns-carousel__previous'
        data-scope='carousel'
        data-part='previous'
        aria-label={`Previous ${label} slide`}
        aria-controls={`${id}-viewport`}
        aria-disabled={!slides.length || index === 0}
        onClick={() => {
          if (current.current > 0) go(current.current - 1);
        }}
      >
        <span aria-hidden='true'>{orientation === 'vertical' ? '⌃' : '‹'}</span>
      </button>
      <div
        ref={viewport}
        id={`${id}-viewport`}
        data-scope='carousel'
        data-part='viewport'
        role='group'
        aria-label={`${label} slides`}
        tabIndex={0}
        onScroll={() => {
          const element = viewport.current;
          if (!element || !slides.length) return;
          const frame = element.getBoundingClientRect();
          const middle = orientation === 'horizontal'
            ? (frame.left + frame.right) / 2
            : (frame.top + frame.bottom) / 2;
          let nearest = 0, distance = Infinity;
          Array.from(element.children).forEach((slide, n) => {
            const rect = slide.getBoundingClientRect();
            const delta = Math.abs(
              middle - (orientation === 'horizontal'
                ? (rect.left + rect.right) / 2
                : (rect.top + rect.bottom) / 2),
            );
            if (delta < distance) {
              distance = delta;
              nearest = n;
            }
          });
          select(nearest);
        }}
      >
        {slides.length
          ? slides.map((slide, n) => (
            <div
              key={n}
              data-scope='carousel'
              data-part='slide'
              role='group'
              aria-roledescription='slide'
              aria-label={`${n + 1} of ${slides.length}: ${slide.label}`}
              inert={hydrated && n !== index}
            >
              {slide.content}
            </div>
          ))
          : <p data-scope='carousel' data-part='empty'>No slides available</p>}
      </div>
      <button
        type='button'
        class='ns-carousel__next'
        data-scope='carousel'
        data-part='next'
        aria-label={`Next ${label} slide`}
        aria-controls={`${id}-viewport`}
        aria-disabled={!slides.length || index === slides.length - 1}
        onClick={() => {
          if (current.current < slides.length - 1) go(current.current + 1);
        }}
      >
        <span aria-hidden='true'>{orientation === 'vertical' ? '⌄' : '›'}</span>
      </button>
      {(dots || counter) && (
        <div data-scope='carousel' data-part='pagination'>
          {dots && (
            <div
              data-scope='carousel'
              data-part='dots'
              role='group'
              aria-label={`Choose ${label} slide`}
            >
              {slides.map((slide, n) => (
                <button
                  type='button'
                  key={n}
                  data-scope='carousel'
                  data-part='dot'
                  aria-label={`Go to ${label} slide ${n + 1}: ${slide.label}`}
                  aria-controls={`${id}-viewport`}
                  aria-current={n === index ? 'true' : undefined}
                  onClick={() => go(n)}
                />
              ))}
            </div>
          )}
          {counter && (
            <span
              data-scope='carousel'
              data-part='counter'
              role='status'
              aria-live='polite'
              aria-atomic='true'
            >
              {slides.length ? index + 1 : 0} / {slides.length}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
