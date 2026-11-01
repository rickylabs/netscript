import type { JSX, VNode } from 'preact';
import { Card } from './card.tsx';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface StatsGridProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
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
  class?: string;
}

type StatsGridComponent = ((props: StatsGridProps) => VNode) & {
  Card: (props: StatsCardProps) => VNode;
};

function StatsGridRoot({ children, class: className, ...props }: StatsGridProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-stats-grid', className)}
      data-part='root'
      data-scope='stats-grid'
    >
      {children}
    </div>
  );
}

function StatsGridCard(
  { label, value, detail, badge, class: className, ...props }: StatsCardProps,
): VNode {
  return (
    <Card
      {...props}
      class={cn('ns-stats-grid__card', className)}
      data-part='card'
      data-scope='stats-grid'
    >
      <Card.Body
        class='ns-stack ns-stats-grid__body'
        data-gap='sm'
        data-part='body'
        data-scope='stats-grid'
      >
        <div class='ns-stats-grid__header' data-part='header' data-scope='stats-grid'>
          <span class='ns-stats-grid__label' data-part='label' data-scope='stats-grid'>
            {label}
          </span>
          {badge}
        </div>
        <p class='ns-stats-grid__value' data-part='value' data-scope='stats-grid'>{value}</p>
        {detail && (
          <p class='ns-stats-grid__detail' data-part='detail' data-scope='stats-grid'>
            {detail}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}

/**
 * Responsive summary metric grid with a shared metric-card sub-seam.
 */
export const StatsGrid: StatsGridComponent = Object.assign(StatsGridRoot, {
  Card: StatsGridCard,
});
