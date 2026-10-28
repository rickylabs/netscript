import { h } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { cn } from '../../registry/lib/cn.ts';

import type {
  DataGridCellVariant,
  DataGridColumn,
  DataGridNode,
  DataGridProps,
  DataGridRenderable,
  DataGridRow,
  DataGridSelectionContext,
} from './data-grid-contract.ts';
export type {
  DataGridCellVariant,
  DataGridColumn,
  DataGridNode,
  DataGridProps,
  DataGridRenderable,
  DataGridRow,
  DataGridRowActionContext,
  DataGridSelectionContext,
} from './data-grid-contract.ts';
export { DATA_GRID_CELL_VARIANTS } from './data-grid-contract.ts';

interface FreshAnchorNavigationAttributes extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  'f-client-nav'?: boolean;
}

/**
 * Renders a generic, templated, token-styled data grid.
 */
export function DataGrid<T>(
  {
    columns,
    rows,
    class: className,
    label,
    selectedIds,
    onSelectionChange,
    renderBulkActions,
    renderRowActions,
    ...props
  }: DataGridProps<T>,
): DataGridNode {
  if (!selectedIds && !onSelectionChange && !renderBulkActions && !renderRowActions) {
    return renderLegacyDataGrid({ columns, rows, class: className, label, ...props });
  }

  const selected = selectedIds ?? new Set<string>();
  const selectableIds = rows.map((row) => row.id);
  const selectedCount = selectableIds.filter((id) => selected.has(id)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const indeterminate = selectedCount > 0 && !allSelected;
  const selectionEnabled = Boolean(selectedIds || onSelectionChange);
  const selectionContext: DataGridSelectionContext = {
    count: selectedCount,
    selectedIds: selected,
    clearSelection: () => onSelectionChange?.(new Set()),
  };
  const templateColumns = columns.map((column) => column.width ?? 'minmax(0, 1fr)').join(' ');
  const tracks = [selectionEnabled ? '2.5rem' : '', templateColumns, renderRowActions ? 'auto' : '']
    .filter(Boolean).join(' ');
  const gridStyle: JSX.CSSProperties = { gridTemplateColumns: tracks };

  const headCells: DataGridNode[] = [];
  if (selectionEnabled) {
    headCells.push(renderSelectionCheckbox({
      checked: allSelected,
      indeterminate,
      label: allSelected ? 'Clear selection' : 'Select all rows',
      onChange: () => onSelectionChange?.(new Set(allSelected ? [] : selectableIds)),
    }));
  }
  headCells.push(
    ...columns.map((column) =>
      h(
        'span',
        {
          key: column.key,
          role: 'columnheader',
          class: 'ns-data-grid__header-cell',
          'data-part': 'header-cell',
          'data-scope': 'data-table',
        },
        column.header,
      ) as DataGridNode
    ),
  );
  if (renderRowActions) {
    headCells.push(
      h('span', { role: 'columnheader', 'aria-label': 'Row actions' }) as DataGridNode,
    );
  }

  const children: DataGridNode[] = [];
  if (selectedCount > 0 && renderBulkActions) {
    children.push(h(
      'div',
      {
        class: 'ns-data-grid__bulk-actions',
        'data-part': 'bulk-actions',
        'data-scope': 'data-table',
        role: 'toolbar',
        'aria-label': `${selectedCount} selected`,
      },
      renderBulkActions(selectionContext) as ComponentChildren,
    ) as DataGridNode);
  }
  children.push(
    h(
      'div',
      {
        role: 'rowgroup',
        class: 'ns-data-grid__head',
        'data-part': 'head',
        'data-scope': 'data-table',
      },
      h('div', {
        role: 'row',
        class: 'ns-data-grid__row',
        'data-type': 'header',
        'data-part': 'row',
        'data-scope': 'data-table',
        style: gridStyle,
      }, headCells as ComponentChildren),
    ) as DataGridNode,
    h(
      'div',
      {
        role: 'rowgroup',
        class: 'ns-data-grid__body',
        'data-part': 'body',
        'data-scope': 'data-table',
      },
      rows.map((row) =>
        renderEnhancedDataGridRow(
          row,
          columns,
          gridStyle,
          selected,
          onSelectionChange,
          selectionEnabled,
          renderRowActions,
        )
      ),
    ) as DataGridNode,
  );

  return h(
    'div',
    {
      ...props,
      role: 'grid',
      'aria-label': label,
      class: cn('ns-data-grid', className),
      'data-part': 'root',
      'data-scope': 'data-table',
      'data-responsive': '',
      style: { overflowX: 'auto', ...(props.style as JSX.CSSProperties | undefined) },
    },
    children as ComponentChildren,
  ) as DataGridNode;
}

function renderLegacyDataGrid<T>(
  { columns, rows, class: className, label, ...props }: DataGridProps<T>,
): DataGridNode {
  const templateColumns = columns.map((column) => column.width ?? 'minmax(0, 1fr)').join(' ');
  const gridStyle: JSX.CSSProperties = { gridTemplateColumns: templateColumns };
  return h(
    'div',
    {
      ...props,
      role: 'grid',
      'aria-label': label,
      class: cn('ns-data-grid', className),
      'data-part': 'root',
      'data-scope': 'data-table',
    },
    h(
      'div',
      {
        role: 'rowgroup',
        class: 'ns-data-grid__head',
        'data-part': 'head',
        'data-scope': 'data-table',
      },
      h(
        'div',
        {
          role: 'row',
          class: 'ns-data-grid__row',
          'data-type': 'header',
          'data-part': 'row',
          'data-scope': 'data-table',
          style: gridStyle,
        },
        columns.map((column) =>
          h(
            'span',
            {
              key: column.key,
              role: 'columnheader',
              class: 'ns-data-grid__header-cell',
              'data-part': 'header-cell',
              'data-scope': 'data-table',
            },
            column.header,
          )
        ),
      ),
    ),
    h(
      'div',
      {
        role: 'rowgroup',
        class: 'ns-data-grid__body',
        'data-part': 'body',
        'data-scope': 'data-table',
      },
      rows.map((row) => renderDataGridRow(row, columns, gridStyle)),
    ),
  ) as DataGridNode;
}

interface SelectionCheckboxOptions {
  checked: boolean;
  indeterminate: boolean;
  label: string;
  onChange: () => void;
}

function renderSelectionCheckbox(options: SelectionCheckboxOptions): DataGridNode {
  return h(
    'span',
    {
      role: 'gridcell',
      class: 'ns-data-grid__selection',
      'data-part': 'selection',
      'data-scope': 'data-table',
    },
    h('input', {
      type: 'checkbox',
      checked: options.checked,
      'aria-label': options.label,
      'aria-checked': options.indeterminate ? 'mixed' : String(options.checked),
      ref: (element: HTMLInputElement | null) => {
        if (element) element.indeterminate = options.indeterminate;
      },
      onClick: (event: Event) => event.stopPropagation(),
      onChange: options.onChange,
    }),
  ) as DataGridNode;
}

function renderEnhancedDataGridRow<T>(
  row: DataGridRow<T>,
  columns: readonly DataGridColumn<T>[],
  gridStyle: JSX.CSSProperties,
  selectedIds: ReadonlySet<string>,
  onSelectionChange: DataGridProps<T>['onSelectionChange'],
  selectionEnabled: boolean,
  renderRowActions: DataGridProps<T>['renderRowActions'],
): DataGridNode {
  const selected = selectedIds.has(row.id);
  const cells: DataGridNode[] = [];
  if (selectionEnabled) {
    cells.push(renderSelectionCheckbox({
      checked: selected,
      indeterminate: false,
      label: `Select row ${row.id}`,
      onChange: () => {
        const next = new Set(selectedIds);
        selected ? next.delete(row.id) : next.add(row.id);
        onSelectionChange?.(next);
      },
    }));
  }
  cells.push(
    ...columns.map((column, index) =>
      row.href && index === 0
        ? renderDataGridLinkCell(row.data, column, row.href)
        : renderDataGridCell(row.data, column)
    ),
  );
  if (renderRowActions) {
    cells.push(h('span', {
      role: 'gridcell',
      class: 'ns-data-grid__actions',
      'data-part': 'actions',
      'data-scope': 'data-table',
      onClick: (event: Event) => event.stopPropagation(),
    }, renderRowActions(row.data, { row, selected }) as ComponentChildren) as DataGridNode);
  }
  const activate = row.onSelect;
  return h(
    'div',
    {
      key: row.id,
      role: 'row',
      'aria-selected': selected ? 'true' : undefined,
      class: cn('ns-data-grid__row'),
      'data-state': selected ? ('selected') : undefined,
      'data-interactive': (row.onSelect || row.href) ? ('true') : undefined,
      'data-part': 'row',
      'data-scope': 'data-table',
      style: gridStyle,
      tabIndex: activate ? 0 : undefined,
      onClick: activate,
      onKeyDown: activate
        ? (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        }
        : undefined,
    },
    cells as ComponentChildren,
  ) as DataGridNode;
}

function renderDataGridLinkCell<T>(
  row: T,
  column: DataGridColumn<T>,
  href: string,
): DataGridNode {
  const content = column.render ? column.render(row) : fallbackCellContent(row, column.key);
  return h(
    'span',
    {
      key: column.key,
      role: 'gridcell',
      class: 'ns-data-grid__cell',
      'data-part': 'cell',
      'data-scope': 'data-table',
    },
    h(
      'a',
      {
        href,
        'f-client-nav': true,
        class: 'ns-data-grid__row-link',
        'data-part': 'row-link',
        'data-scope': 'data-table',
      },
      renderCellContent(content, column.cell) as ComponentChildren,
    ),
  ) as DataGridNode;
}

function renderDataGridRow<T>(
  row: DataGridRow<T>,
  columns: readonly DataGridColumn<T>[],
  gridStyle: JSX.CSSProperties,
): DataGridNode {
  const rowClass = cn('ns-data-grid__row');
  const cells = columns.map((column) => renderDataGridCell(row.data, column));
  const selected = row.selected ? 'true' : undefined;

  if (row.onSelect) {
    return h(
      'button',
      {
        key: row.id,
        type: 'button',
        role: 'row',
        'aria-selected': selected,
        class: rowClass,
        'data-state': (row.selected) ? ('selected') : undefined,
        'data-type': row.href ? 'link' : 'button',
        'data-part': 'row',
        'data-scope': 'data-table',
        style: gridStyle,
        onClick: row.onSelect,
      },
      cells as ComponentChildren,
    ) as DataGridNode;
  }

  if (row.href) {
    const linkProps: FreshAnchorNavigationAttributes = {
      href: row.href,
      'f-client-nav': true,
    };

    return h(
      'a',
      {
        key: row.id,
        ...linkProps,
        role: 'row',
        'aria-selected': selected,
        class: rowClass,
        'data-state': (row.selected) ? ('selected') : undefined,
        'data-type': row.href ? 'link' : 'button',
        'data-part': 'row',
        'data-scope': 'data-table',
        style: gridStyle,
      },
      cells as ComponentChildren,
    ) as DataGridNode;
  }

  return h(
    'div',
    {
      key: row.id,
      role: 'row',
      'aria-selected': selected,
      class: rowClass,
      'data-state': (row.selected) ? ('selected') : undefined,
      'data-type': ((row.href) ? ('link') : undefined) ?? ((row.onSelect) ? ('button') : undefined),
      'data-part': 'row',
      'data-scope': 'data-table',
      style: gridStyle,
    },
    cells as ComponentChildren,
  ) as DataGridNode;
}

function renderDataGridCell<T>(
  row: T,
  column: DataGridColumn<T>,
): DataGridNode {
  const content = column.render ? column.render(row) : fallbackCellContent(row, column.key);

  return h(
    'span',
    {
      key: column.key,
      role: 'gridcell',
      class: cn('ns-data-grid__cell', column.cell && ''),
      'data-variant': (column.cell) ? (column.cell) : undefined,
      'data-part': 'cell',
      'data-scope': 'data-table',
    },
    renderCellContent(content, column.cell) as ComponentChildren,
  ) as DataGridNode;
}

function renderCellContent(
  content: DataGridRenderable,
  variant: DataGridCellVariant | undefined,
): DataGridRenderable {
  if (variant === 'strong') {
    return h('strong', {
      class: 'ns-data-grid__cell-strong',
      'data-part': 'cell-strong',
      'data-scope': 'data-table',
    }, content as ComponentChildren);
  }

  if (variant === 'num') {
    return h('span', {
      class: 'ns-data-grid__cell-num',
      'data-part': 'cell-num',
      'data-scope': 'data-table',
    }, content as ComponentChildren);
  }

  return content;
}

function fallbackCellContent<T>(row: T, key: string): DataGridRenderable {
  if (!row || typeof row !== 'object' || !(key in row)) {
    return null;
  }

  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return String(value);
}
