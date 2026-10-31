/**
 * @component Resizable
 * @layer 2
 * @depends theme-seed, cn
 * @description Two native content panels with a bounded, keyboard-operable splitter.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Pixel-based resize inputs; hydrate inside a Fresh island to enable the handle. */
export interface ResizableProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'size'> {
  /** Accessible fallback name shared by the primary panel and splitter. */
  label: string;
  /** Accessible name of the independently scrollable secondary panel. */
  endLabel?: string;
  /** ID of a visible primary-panel heading, used by both accessible names. */
  labelledBy?: string;
  /** Panel arrangement; defaults to horizontal. */
  direction?: 'horizontal' | 'vertical';
  /** Content of the primary/start panel. */
  startContent?: ComponentChildren;
  /** Content of the secondary/end panel. */
  endContent?: ComponentChildren;
  /** Show the small decorative grip; defaults to true. */
  grip?: boolean;
  /** Controlled primary-panel size in pixels. */
  size?: number;
  /** Initial uncontrolled size; defaults to 280 horizontal or 160 vertical. */
  defaultSize?: number;
  /** Receive a bounded pixel proposal from a user interaction. */
  onSizeChange?: (pixels: number) => void;
  /** Preferred minimum primary-panel size; defaults to 80 pixels. */
  minSize?: number;
  /** Maximum primary-panel size; defaults to unbounded. */
  maxSize?: number;
  /** Preferred secondary-panel minimum; defaults to 80 pixels. */
  endMinSize?: number;
  /** Arrow-key increment; defaults to 10 pixels. */
  step?: number;
  /** Additional frame classes. */
  class?: string;
}

interface ResizeGesture {
  readonly pointerId: number;
  readonly coordinate: number;
  readonly size: number;
  readonly sign: number;
}

/**
 * Resize the primary pane with pointer capture or arrows/Home/End; no collapse mode is added.
 * @example
 * ```tsx
 * <Resizable label='Contents' startContent='Contents' endContent='Document' style={{ height: 240 }} />
 * ```
 */
export function Resizable({
  label,
  endLabel = 'Secondary panel',
  labelledBy,
  direction = 'horizontal',
  startContent,
  endContent,
  grip = true,
  size,
  defaultSize = direction === 'horizontal' ? 280 : 160,
  onSizeChange,
  minSize = 80,
  maxSize = Infinity,
  endMinSize = 80,
  step = 10,
  class: className,
  ...props
}: ResizableProps): VNode {
  if (!label.trim()) throw new TypeError('Resizable label must name the primary panel');
  if (!endLabel.trim()) throw new TypeError('Resizable endLabel must name the secondary panel');
  for (
    const [name, value] of Object.entries({
      minSize,
      endMinSize,
      defaultSize,
      ...(size === undefined ? {} : { size }),
    })
  ) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`Resizable ${name} must be finite and nonnegative`);
    }
  }
  if ((!Number.isFinite(maxSize) && maxSize !== Infinity) || maxSize < minSize) {
    throw new RangeError('Resizable maxSize must be at least minSize and finite or unbounded');
  }
  if (!Number.isFinite(step) || step <= 0) {
    throw new RangeError('Resizable step must be positive and finite');
  }
  const primaryId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<ResizeGesture | undefined>(undefined);
  const [localSize, setLocalSize] = useState(defaultSize);
  const [available, setAvailable] = useState(0);
  const horizontal = direction === 'horizontal';
  const ready = available > 0;
  const maximum = ready
    ? Math.min(maxSize, Math.max(0, available - Math.min(endMinSize, available / 2)))
    : maxSize;
  const minimum = Math.min(minSize, maximum);
  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, value));
  const displayed = clamp(size ?? localSize);
  const percentage = (pixels: number) => Math.round(pixels / available * 1000) / 10;
  const nameId = labelledBy?.trim() || undefined;

  useEffect(() => {
    const group = groupRef.current;
    const handle = handleRef.current;
    if (!group || !handle) return;
    const measure = () => {
      const style = getComputedStyle(group);
      const gap = Number.parseFloat(horizontal ? style.columnGap : style.rowGap) || 0;
      const extent = horizontal ? group.clientWidth : group.clientHeight;
      const next = Math.max(0, extent - gap);
      setAvailable(next);
      if (next === 0) {
        const active = gesture.current;
        gesture.current = undefined;
        if (active && handle.hasPointerCapture(active.pointerId)) {
          handle.releasePointerCapture(active.pointerId);
        }
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    measure();
    return () => {
      observer.disconnect();
      const active = gesture.current;
      gesture.current = undefined;
      if (active && handle.hasPointerCapture(active.pointerId)) {
        handle.releasePointerCapture(active.pointerId);
      }
    };
  }, [horizontal]);

  const propose = (pixels: number) => {
    const next = clamp(pixels);
    if (next === displayed) return;
    if (size === undefined) setLocalSize(next);
    onSizeChange?.(next);
  };
  const release = (event: JSX.TargetedPointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  return (
    <div
      {...props}
      class={cn('ns-resizable', className)}
      data-scope='resizable'
      data-part='root'
      data-direction={direction}
    >
      <div
        ref={groupRef}
        class='ns-resizable__group'
        data-scope='resizable'
        data-part='panel-group'
        style={{ '--ns-resizable-start-size': `${displayed}px` }}
      >
        <div
          id={primaryId}
          class='ns-resizable__panel'
          role='group'
          tabIndex={0}
          aria-label={nameId ? undefined : label}
          aria-labelledby={nameId}
          data-scope='resizable'
          data-part='panel'
        >
          {startContent}
        </div>
        <div
          ref={handleRef}
          class='ns-resizable__handle'
          data-scope='resizable'
          data-part='handle'
          role={ready ? 'separator' : undefined}
          tabIndex={ready ? 0 : -1}
          aria-hidden={ready ? undefined : 'true'}
          aria-label={ready && !nameId ? label : undefined}
          aria-labelledby={ready ? nameId : undefined}
          aria-controls={ready ? primaryId : undefined}
          aria-orientation={ready ? (horizontal ? 'vertical' : 'horizontal') : undefined}
          aria-valuemin={ready ? percentage(minimum) : undefined}
          aria-valuemax={ready ? percentage(maximum) : undefined}
          aria-valuenow={ready ? percentage(displayed) : undefined}
          aria-valuetext={ready ? `${Math.round(displayed * 10) / 10} pixels` : undefined}
          onKeyDown={(event) => {
            if (
              !ready || event.defaultPrevented || event.target !== event.currentTarget ||
              event.altKey || event.ctrlKey || event.metaKey
            ) return;
            const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
            const increase = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
            const decrease = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
            let next: number;
            if (event.key === 'Home') next = minimum;
            else if (event.key === 'End') next = maximum;
            else if (event.key === increase) next = displayed + step;
            else if (event.key === decrease) next = displayed - step;
            else return;
            event.preventDefault();
            propose(next);
          }}
          onPointerDown={(event) => {
            if (!ready || event.button !== 0 || gesture.current) return;
            const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
            gesture.current = {
              pointerId: event.pointerId,
              coordinate: horizontal ? event.clientX : event.clientY,
              size: displayed,
              sign: horizontal && rtl ? -1 : 1,
            };
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            const active = gesture.current;
            if (!active || active.pointerId !== event.pointerId) return;
            const coordinate = horizontal ? event.clientX : event.clientY;
            propose(active.size + (coordinate - active.coordinate) * active.sign);
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={(event) => {
            if (gesture.current?.pointerId === event.pointerId) gesture.current = undefined;
          }}
        >
          {grip && (
            <span
              class='ns-resizable__grip'
              aria-hidden='true'
              data-scope='resizable'
              data-part='grip'
            >
              <Icon name='grip-vertical' size={10} />
            </span>
          )}
        </div>
        <div
          class='ns-resizable__panel'
          role='group'
          aria-label={endLabel}
          tabIndex={0}
          data-scope='resizable'
          data-part='panel'
        >
          {endContent}
        </div>
      </div>
    </div>
  );
}
