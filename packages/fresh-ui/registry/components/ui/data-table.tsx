import type { JSX, VNode } from 'preact';
import { Card } from './card.tsx';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface DataTableSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

interface DataTableProps extends DataTableSectionProps {
  interactive?: boolean;
}

interface DataTableRowProps extends DataTableSectionProps {
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

function DataTableRoot({ children, class: className, ...props }: DataTableProps): VNode {
  return <Card {...props} class={cn('ns-data-table', className)}>{children}</Card>;
}

function DataTableHeader({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <Card.Header {...props} class={cn('ns-data-table__header', className)}>
      {children}
    </Card.Header>
  );
}

function DataTableBody({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return <div {...props} class={cn('ns-data-table__body', className)}>{children}</div>;
}

function DataTableRow(
  { children, class: className, cols, style, ...props }: DataTableRowProps,
): VNode {
  const gridStyle = cols
    ? { ...(style && typeof style === 'object' ? style : null), gridTemplateColumns: cols }
    : style;
  return (
    <div {...props} style={gridStyle} class={cn('ns-data-table__row', className)}>
      {children}
    </div>
  );
}

function DataTableFooter({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <div {...props} class={cn('ns-data-table__footer', className)}>
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
