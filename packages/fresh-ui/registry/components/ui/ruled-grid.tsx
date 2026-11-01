/**
 * @component RuledGrid
 * @layer 2
 * @depends theme-seed, cn
 * @description Responsive Docs cards with native caller-owned controls and logical rules.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Column requests adapt to the block's available inline size without JavaScript. */
export interface RuledGridProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  columns?: '2' | '3' | '4';
  variant?: 'ruled' | 'feature';
  class?: string;
}

/** A private Docs card; supplied title/action controls retain native behavior. */
export interface RuledGridCellProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'title'> {
  eyebrow?: ComponentChildren;
  icon?: ComponentChildren;
  title?: ComponentChildren;
  action?: ComponentChildren;
  class?: string;
}

/** The frame adds no click handler, link role or tab stop. */
export function RuledGridCell(
  { eyebrow, icon, title, children, action, class: className, ...props }: RuledGridCellProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-ruled-grid__cell', className)}
      data-scope='ruled-grid'
      data-part='cell'
      data-columns={undefined}
      data-variant={undefined}
    >
      <div class='ns-ruled-grid__card' data-scope='ruled-grid' data-part='card'>
        {eyebrow != null && <div data-scope='ruled-grid' data-part='eyebrow'>{eyebrow}</div>}
        <div class='ns-ruled-grid__head'>
          {icon != null && <div data-scope='ruled-grid' data-part='icon'>{icon}</div>}
          {title != null && <div data-scope='ruled-grid' data-part='title'>{title}</div>}
          <span data-scope='ruled-grid' data-part='arrow' aria-hidden='true'>↗</span>
        </div>
        {children != null && <div data-scope='ruled-grid' data-part='description'>{children}</div>}
        {action != null && <div data-scope='ruled-grid' data-part='action'>{action}</div>}
      </div>
    </div>
  );
}

function RuledGridRoot(
  { columns = '3', variant = 'ruled', children, class: className, ...props }: RuledGridProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-ruled-grid', className)}
      data-scope='ruled-grid'
      data-part='root'
      data-columns={columns}
      data-variant={variant}
    >
      <div data-scope='ruled-grid' data-part='grid'>{children}</div>
    </div>
  );
}

/** Callable grid plus its private Docs-card composition member. */
export interface RuledGridComponent {
  (props: RuledGridProps): VNode;
  Cell: typeof RuledGridCell;
}

/** Compose cards without importing the unrelated base Card component. */
export const RuledGrid: RuledGridComponent = Object.assign(RuledGridRoot, { Cell: RuledGridCell });
