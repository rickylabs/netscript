/**
 * @component Skeleton
 * @layer 2
 * @depends theme-seed
 * @description Generic dashboard loading scaffold for table, stats, detail, and form surfaces.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface SkeletonProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
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
  { class: className, style, ...props }: Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class'> & {
    class?: string;
  },
): VNode {
  return (
    <span
      {...props}
      aria-hidden='true'
      class={cn('ns-skeleton__block', className)}
      data-part='block'
      data-scope='skeleton'
      style={style}
    />
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
      <div
        {...props}
        aria-hidden='true'
        class={cn('ns-skeleton ns-grid', className)}
        data-variant='stats'
        data-part='root'
        data-scope='skeleton'
      >
        {Array.from(
          { length: resolvedCards },
          (_, index) => (
            <div
              key={`stats-${index}`}
              class='ns-skeleton__card'
              data-part='card'
              data-scope='skeleton'
            >
              <SkeletonBlock
                class=''
                data-size='xs'
                data-part='line'
                data-scope='skeleton'
                style={{ width: `${38 + ((index % 3) * 8)}%` }}
              />
              <SkeletonBlock
                class=''
                data-size='lg'
                data-part='line'
                data-scope='skeleton'
                style={{ width: `${58 + ((index % 2) * 14)}%` }}
              />
              <SkeletonBlock
                class=''
                data-size='xs'
                data-part='line'
                data-scope='skeleton'
                style={{ width: '30%' }}
              />
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
        class={cn('ns-skeleton ns-stack', className)}
        data-variant='detail'
        data-gap='lg'
        data-part='root'
        data-scope='skeleton'
      >
        {Array.from(
          { length: resolvedRows },
          (_, index) => (
            <div
              key={`detail-${index}`}
              class='ns-stack'
              data-gap='sm'
              data-part='root'
              data-scope='stack'
            >
              <SkeletonBlock
                class=''
                data-size='md'
                data-part='line'
                data-scope='skeleton'
                style={{ width: index === 0 ? '32%' : '24%' }}
              />
              <SkeletonBlock
                class=''
                data-size='sm'
                data-part='line'
                data-scope='skeleton'
                style={{ width: '100%' }}
              />
              <SkeletonBlock
                class=''
                data-size='sm'
                data-part='line'
                data-scope='skeleton'
                style={{ width: '86%' }}
              />
              <SkeletonBlock
                class=''
                data-size='sm'
                data-part='line'
                data-scope='skeleton'
                style={{ width: '64%' }}
              />
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
        class={cn('ns-skeleton ns-stack', className)}
        data-variant='form'
        data-gap='md'
        data-part='root'
        data-scope='skeleton'
      >
        {Array.from(
          { length: resolvedRows },
          (_, index) => (
            <div
              key={`form-${index}`}
              class='ns-stack'
              data-gap='sm'
              data-part='root'
              data-scope='stack'
            >
              <SkeletonBlock
                class=''
                data-size='xs'
                data-part='line'
                data-scope='skeleton'
                style={{ width: `${30 + ((index % 3) * 12)}%` }}
              />
              <SkeletonBlock
                class='ns-skeleton__box'
                data-shape='input'
                data-part='box'
                data-scope='skeleton'
              />
            </div>
          ),
        )}
        <div class='ns-cluster' data-part='root' data-scope='cluster'>
          <SkeletonBlock
            class='ns-skeleton__box'
            data-shape='input'
            data-part='box'
            data-scope='skeleton'
            style={{ width: '7rem' }}
          />
          <SkeletonBlock
            class='ns-skeleton__box'
            data-shape='input'
            data-part='box'
            data-scope='skeleton'
            style={{ width: '5.5rem' }}
          />
        </div>
      </div>
    );
  }

  const tableColumns = `repeat(${resolvedColumns}, minmax(0, 1fr))`;

  return (
    <div
      {...props}
      aria-hidden='true'
      class={cn('ns-skeleton', className)}
      data-variant='table'
      data-part='root'
      data-scope='skeleton'
    >
      <div
        class='ns-skeleton__table-row'
        data-type='header'
        data-part='table-row'
        data-scope='skeleton'
        style={{ gridTemplateColumns: tableColumns }}
      >
        {Array.from(
          { length: resolvedColumns },
          (_, index) => (
            <SkeletonBlock
              key={`table-head-${index}`}
              class=''
              data-size='xs'
              data-part='line'
              data-scope='skeleton'
              style={{ width: `${44 + ((index % 3) * 12)}%` }}
            />
          ),
        )}
      </div>
      {Array.from({ length: resolvedRows }, (_, rowIndex) => (
        <div
          key={`table-row-${rowIndex}`}
          class='ns-skeleton__table-row'
          data-part='table-row'
          data-scope='skeleton'
          style={{ gridTemplateColumns: tableColumns }}
        >
          {Array.from({ length: resolvedColumns }, (_, columnIndex) => (
            <SkeletonBlock
              key={`table-cell-${rowIndex}-${columnIndex}`}
              class=''
              data-size='sm'
              data-part='line'
              data-scope='skeleton'
              style={{ width: `${58 + (((rowIndex * 2 + columnIndex) % 4) * 9)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
