/**
 * @component Skeleton
 * @layer 2
 * @depends theme-seed
 * @description Generic dashboard loading scaffold for table, stats, detail, and form surfaces.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface SkeletonProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  cards?: number;
  class?: string;
  columns?: number;
  rows?: number;
  variant: 'table' | 'stats' | 'detail' | 'form';
}

function clamp(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function SkeletonBlock(
  { class: className, style }: { class?: string; style?: JSX.CSSProperties },
): VNode {
  return (
    <span aria-hidden='true' class={cn('ns-skeleton__block', className)} style={style} />
  );
}

/**
 * Renders loading scaffolds for table, stats, detail, and form states.
 */
export function Skeleton(
  { cards = 4, class: className, columns = 4, rows = 4, variant, ...props }: SkeletonProps,
): VNode {
  const resolvedCards = clamp(cards, 4);
  const resolvedColumns = clamp(columns, 4);
  const resolvedRows = clamp(rows, 4);

  if (variant === 'stats') {
    return (
      <div {...props} aria-hidden='true' class={cn('ns-skeleton ns-grid', className)}>
        {Array.from(
          { length: resolvedCards },
          (_, index) => (
            <div key={`stats-${index}`} class='ns-stack ns-stack--sm'>
              <SkeletonBlock class='ns-skeleton__box ns-skeleton__box--card' />
              <SkeletonBlock class='ns-skeleton__line--sm' style={{ width: '55%' }} />
            </div>
          ),
        )}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div
        {...props}
        aria-hidden='true'
        class={cn('ns-skeleton ns-stack ns-stack--lg', className)}
      >
        {Array.from(
          { length: resolvedRows },
          (_, index) => (
            <div key={`detail-${index}`} class='ns-stack ns-stack--sm'>
              <SkeletonBlock
                class='ns-skeleton__line--md'
                style={{ width: index === 0 ? '32%' : '24%' }}
              />
              <SkeletonBlock class='ns-skeleton__line--sm' style={{ width: '100%' }} />
              <SkeletonBlock class='ns-skeleton__line--sm' style={{ width: '86%' }} />
              <SkeletonBlock class='ns-skeleton__line--sm' style={{ width: '64%' }} />
            </div>
          ),
        )}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div
        {...props}
        aria-hidden='true'
        class={cn('ns-skeleton ns-stack ns-stack--md', className)}
      >
        {Array.from(
          { length: resolvedRows },
          (_, index) => (
            <div key={`form-${index}`} class='ns-stack ns-stack--sm'>
              <SkeletonBlock
                class='ns-skeleton__line--xs'
                style={{ width: `${30 + ((index % 3) * 12)}%` }}
              />
              <SkeletonBlock class='ns-skeleton__box ns-skeleton__box--input' />
            </div>
          ),
        )}
        <div class='ns-cluster'>
          <SkeletonBlock
            class='ns-skeleton__box ns-skeleton__box--input'
            style={{ width: '7rem' }}
          />
          <SkeletonBlock
            class='ns-skeleton__box ns-skeleton__box--input'
            style={{ width: '5.5rem' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      {...props}
      aria-hidden='true'
      class={cn('ns-skeleton ns-stack ns-stack--sm', className)}
    >
      <div
        class='ns-skeleton__table-row'
        style={{ gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))` }}
      >
        {Array.from(
          { length: resolvedColumns },
          (_, index) => (
            <SkeletonBlock
              key={`table-head-${index}`}
              class='ns-skeleton__line--xs'
              style={{ width: `${60 + ((index % 2) * 15)}%` }}
            />
          ),
        )}
      </div>
      {Array.from({ length: resolvedRows }, (_, rowIndex) => (
        <div
          key={`table-row-${rowIndex}`}
          class='ns-skeleton__table-row'
          style={{ gridTemplateColumns: `repeat(${resolvedColumns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: resolvedColumns }, (_, columnIndex) => (
            <SkeletonBlock
              key={`table-cell-${rowIndex}-${columnIndex}`}
              class='ns-skeleton__line--sm'
              style={{ width: `${70 + (((rowIndex + columnIndex) % 3) * 10)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
