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

type DataTableComponent = ((props: DataTableProps) => VNode) & {
  Header: (props: DataTableSectionProps) => VNode;
  Body: (props: DataTableSectionProps) => VNode;
  Row: (props: DataTableSectionProps) => VNode;
  Footer: (props: DataTableSectionProps) => VNode;
};

function DataTableRoot({ children, class: className, ...props }: DataTableProps): VNode {
  return <Card {...props} class={cn('overflow-hidden', className)}>{children}</Card>;
}

function DataTableHeader({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <Card.Header
      {...props}
      class={cn(
        'flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      {children}
    </Card.Header>
  );
}

function DataTableBody({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <div {...props} class={cn('divide-y divide-ns-border', className)}>{children}</div>
  );
}

function DataTableRow({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return <div {...props} class={cn('grid gap-4 px-5 py-4', className)}>{children}</div>;
}

function DataTableFooter({ children, class: className, ...props }: DataTableSectionProps): VNode {
  return (
    <div
      {...props}
      class={cn('border-t border-ns-border px-5 py-4', className)}
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
