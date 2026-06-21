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
    <div {...props} class={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}

function StatsGridCard(
  { label, value, detail, badge, class: className, ...props }: StatsCardProps,
): VNode {
  return (
    <Card {...props} class={cn('overflow-hidden', className)}>
      <Card.Body class='ns-stack ns-stack--sm min-w-0'>
        <div class='ns-cluster ns-cluster--between gap-3'>
          <span class='text-[0.7rem] font-mono uppercase tracking-[0.18em] text-ns-muted-fg'>
            {label}
          </span>
          {badge}
        </div>
        <p class='text-3xl font-semibold tracking-tight tabular-nums text-ns-fg'>{value}</p>
        {detail && <p class='text-sm leading-relaxed text-ns-muted-fg'>{detail}</p>}
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
