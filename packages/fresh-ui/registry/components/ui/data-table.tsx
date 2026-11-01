import type { JSX, VNode } from 'preact';
import { Card } from './card.tsx';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/** Native content seam for the copied DataTable frame. */
export interface DataTableSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

/** Presentation state of the caller-owned table composition. */
export type DataTableState = 'default' | 'selection' | 'empty' | 'loading';

/** Frame props; native child controls own interaction. */
export interface DataTableProps extends DataTableSectionProps {
  interactive?: boolean;
  state?: DataTableState;
}

/** Grid row for caller-owned compound content. */
export interface DataTableRowProps extends DataTableSectionProps {
  /**
   * CSS `grid-template-columns` for this row's cells, e.g. `'2fr 1fr 1fr'` or
   * `'minmax(0, 1fr) auto'`. Without it the row is a single-column grid and
   * cells stack — pass the same template to header and body rows to align them.
   */
  cols?: string;
}

type DataTableComponent = ((props: DataTableProps) => VNode) & {
  Header: (props: DataTableSectionProps) => VNode;
  Body: (props: DataTableSectionProps) => VNode;
  Row: (props: DataTableRowProps) => VNode;
  Footer: (props: DataTableSectionProps) => VNode;
};

function DataTableRoot(
  { children, class: className, state = 'default', interactive = false, ...props }: DataTableProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-card ns-data-table', className)}
      data-part='root'
      data-scope='data-table'
      data-state={state}
      data-interactive={interactive ? 'true' : undefined}
      aria-busy={state === 'loading' ? 'true' : props['aria-busy']}
    >
      {children}
    </div>
  );
}

function DataTableHeader({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <Card.Header
      {...props}
      class={cn('ns-data-table__header', className)}
      data-part='header'
      data-scope='data-table'
    >
      {children}
    </Card.Header>
  );
}

function DataTableBody({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-data-table__body', className)}
      data-part='body'
      data-scope='data-table'
    >
      {children}
    </div>
  );
}

function DataTableRow(
  { children, class: className, cols, style, ...props }: DataTableRowProps,
): VNode {
  const gridStyle = cols
    ? typeof style === 'string'
      ? `${style};grid-template-columns:${cols}`
      : { ...style, gridTemplateColumns: cols }
    : style;
  return (
    <div
      {...props}
      style={gridStyle}
      class={cn('ns-data-table__row', className)}
      data-part='row'
      data-scope='data-table'
    >
      {children}
    </div>
  );
}

function DataTableFooter({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-data-table__footer', className)}
      data-part='footer'
      data-scope='data-table'
    >
      {children}
    </div>
  );
}

/**
 * Card-backed data table block with shared header, row, and footer seams.
 */
export const DataTable: DataTableComponent = Object.assign(DataTableRoot, {
  Header: DataTableHeader,
  Body: DataTableBody,
  Row: DataTableRow,
  Footer: DataTableFooter,
});
