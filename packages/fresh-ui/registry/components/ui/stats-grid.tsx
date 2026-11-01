import type { JSX, VNode } from 'preact';
import { Card } from './card.tsx';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/** Maximum columns before the grid adapts to its containing element. */
export type StatsGridColumns = 2 | 3 | 4;

/** Container-adaptive metric layout; unset columns preserves automatic fitting. */
export interface StatsGridProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  columns?: StatsGridColumns;
  joined?: boolean;
  class?: string;
}

/**
 * Summary metric card content.
 */
export interface StatsCardProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Small uppercase label above the metric value. */
  label: Renderable;
  /** Primary metric value. */
  value: Renderable;
  /** Optional supporting detail below the metric. */
  detail?: Renderable;
  /** Optional badge rendered beside the label. */
  badge?: Renderable;
  /** Decorative icon; supply controls through badge or detail instead. */
  icon?: Renderable;
  /** Primary surface, independent of Card's variant vocabulary. */
  variant?: 'default' | 'hero';
  /** Decorative arrow; include the signed change in detail text. */
  delta?: 'up' | 'down' | 'none';
  /** Optional decorative content, controlled by the theme's visibility role. */
  sparkline?: Renderable;
  /** Optional decorative content, controlled by the theme's visibility role. */
  ticks?: Renderable;
  /** Optional decorative content, controlled by the theme's visibility role. */
  blockbars?: Renderable;
  class?: string;
}

type StatsGridComponent = ((props: StatsGridProps) => VNode) & {
  Card: (props: StatsCardProps) => VNode;
};

function StatsGridRoot(
  { children, columns, joined = false, class: className, ...props }: StatsGridProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-stats-grid', className)}
      data-part='root'
      data-scope='stats-grid'
      data-columns={columns}
      data-joined={String(joined)}
    >
      {children}
    </div>
  );
}

function StatsGridCard(
  {
    label,
    value,
    detail,
    badge,
    icon,
    variant = 'default',
    delta = 'none',
    sparkline,
    ticks,
    blockbars,
    class: className,
    ...props
  }: StatsCardProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card ns-stats-grid__card', className)}
      data-part='card'
      data-scope='stats-grid'
      data-variant={variant}
      data-delta={delta}
    >
      <Card.Body
        class='ns-stats-grid__body'
        data-part='body'
        data-scope='stats-grid'
      >
        <div class='ns-stats-grid__header' data-part='header' data-scope='stats-grid'>
          <span class='ns-stats-grid__label' data-part='label' data-scope='stats-grid'>
            {label}
          </span>
          {badge != null && badge !== false && (
            <span class='ns-stats-grid__badge' data-part='badge' data-scope='stats-grid'>
              {badge}
            </span>
          )}
          {icon != null && icon !== false && (
            <span
              class='ns-stats-grid__icon'
              data-part='icon'
              data-scope='stats-grid'
              aria-hidden='true'
              inert
            >
              {icon}
            </span>
          )}
        </div>
        <p class='ns-stats-grid__value' data-part='value' data-scope='stats-grid'>{value}</p>
        {detail != null && detail !== false && (
          <p class='ns-stats-grid__detail' data-part='detail' data-scope='stats-grid'>
            {delta !== 'none' && (
              <span
                class='ns-stats-grid__delta'
                data-part='delta'
                data-scope='stats-grid'
                aria-hidden='true'
              >
                {delta === 'up' ? '↗' : '↘'}
              </span>
            )}
            {detail}
          </p>
        )}
      </Card.Body>
      {(['sparkline', 'ticks', 'blockbars'] as const).map((part) => {
        const content = { sparkline, ticks, blockbars }[part];
        return content != null && content !== false && (
          <div
            key={part}
            class={`ns-stats-grid__${part}`}
            data-part={part}
            data-scope='stats-grid'
            aria-hidden='true'
            inert
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Responsive summary metric grid with a shared metric-card sub-seam.
 */
export const StatsGrid: StatsGridComponent = Object.assign(StatsGridRoot, {
  Card: StatsGridCard,
});
