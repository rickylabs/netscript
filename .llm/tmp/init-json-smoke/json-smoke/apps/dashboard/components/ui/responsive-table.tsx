import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

export type ResponsiveTableAlign = 'start' | 'center' | 'end';
export type ResponsiveTablePriority = 'primary' | 'secondary' | 'tertiary';

export interface ResponsiveTableColumn<Row> {
  key: string;
  label: string;
  header?: Renderable;
  cell: (row: Row, index: number) => Renderable;
  align?: ResponsiveTableAlign;
  priority?: ResponsiveTablePriority;
  class?: string;
  headerClass?: string;
}

export interface ResponsiveTableProps<Row>
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  columns: readonly ResponsiveTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row, index: number) => string | number;
  caption?: Renderable;
  emptyState?: Renderable;
  summary?: Renderable;
  class?: string;
}

/**
 * Layer-3 data table block that keeps table semantics on wide screens and
 * presents row cards with generated cell labels on compact screens.
 */
export function ResponsiveTable<Row>(
  {
    columns,
    rows,
    getRowKey,
    caption,
    emptyState = 'No records to display.',
    summary,
    class: className,
    ...props
  }: ResponsiveTableProps<Row>,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-responsive-table', className)}
      data-empty={rows.length === 0 ? 'true' : undefined}
    >
      <div class='ns-responsive-table__scroller'>
        <table class='ns-responsive-table__table'>
          {caption && <caption class='ns-responsive-table__caption'>{caption}</caption>}
          <thead class='ns-responsive-table__head'>
            <tr class='ns-responsive-table__row ns-responsive-table__row--head'>
              {columns.map((column) => (
                <th
                  key={column.key}
                  class={cn('ns-responsive-table__header', column.headerClass)}
                  data-align={column.align ?? 'start'}
                  scope='col'
                >
                  {column.header ?? column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody class='ns-responsive-table__body'>
            {rows.length === 0
              ? (
                <tr class='ns-responsive-table__row'>
                  <td class='ns-responsive-table__empty' colSpan={columns.length}>
                    {emptyState}
                  </td>
                </tr>
              )
              : rows.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  class='ns-responsive-table__row'
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      class={cn('ns-responsive-table__cell', column.class)}
                      data-align={column.align ?? 'start'}
                      data-label={column.label}
                      data-priority={column.priority ?? 'secondary'}
                    >
                      <span class='ns-responsive-table__cell-value'>
                        {column.cell(row, rowIndex)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {summary && <div class='ns-responsive-table__summary'>{summary}</div>}
    </div>
  );
}
