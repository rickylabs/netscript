import { h } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { cn } from '../../registry/lib/cn.ts';

/**
 * Built-in cell treatments supported by {@link DataGridColumn}.
 */
export const DATA_GRID_CELL_VARIANTS = ['strong', 'num'] as const;

/**
 * Built-in cell treatment names supported by {@link DataGridColumn}.
 */
export type DataGridCellVariant = typeof DATA_GRID_CELL_VARIANTS[number];

/**
 * Structural node returned by {@link DataGrid}.
 */
export interface DataGridNode {
  /**
   * Render target, such as an intrinsic element name or component function.
   */
  type: unknown;
  /**
   * Props attached to the rendered node.
   */
  props: unknown;
  /**
   * Optional render key carried by the rendered node.
   */
  key: unknown;
}

/**
 * Preact-compatible renderable content accepted by {@link DataGridColumn.render}.
 */
export type DataGridRenderable =
  | DataGridNode
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly DataGridRenderable[];

/**
 * Column contract for {@link DataGrid}.
 */
export interface DataGridColumn<T> {
  /**
   * Property key used for fallback cell content and stable cell identity.
   */
  readonly key: string;
  /**
   * Visible column header.
   */
  readonly header: string;
  /**
   * CSS grid track width for the column, such as `2fr` or `minmax(0, 12rem)`.
   */
  readonly width?: string;
  /**
   * Optional built-in cell treatment.
   */
  readonly cell?: DataGridCellVariant;
  /**
   * Optional per-column template. Receives the row data object.
   */
  readonly render?: (row: T) => DataGridRenderable;
}

/** Controlled selection context supplied to DataGrid action slots. */
export interface DataGridSelectionContext {
  readonly count: number;
  readonly selectedIds: ReadonlySet<string>;
  readonly clearSelection: () => void;
}

/** Typed context supplied to each DataGrid row-action slot. */
export interface DataGridRowActionContext<T> {
  readonly row: DataGridRow<T>;
  readonly selected: boolean;
}

/**
 * Plain, button, or Fresh client-navigation row contract for {@link DataGrid}.
 */
export type DataGridRow<T> =
  | {
    /**
     * Stable row identity.
     */
    readonly id: string;
    /**
     * Caller-owned row payload.
     */
    readonly data: T;
    /**
     * Marks the row as selected for visual and assistive-technology state.
     */
    readonly selected?: boolean;
    readonly onSelect?: undefined;
    readonly href?: undefined;
  }
  | {
    /**
     * Stable row identity.
     */
    readonly id: string;
    /**
     * Caller-owned row payload.
     */
    readonly data: T;
    /**
     * Marks the row as selected for visual and assistive-technology state.
     */
    readonly selected?: boolean;
    /**
     * Click handler that renders the row as a button.
     */
    readonly onSelect: () => void;
    readonly href?: never;
  }
  | {
    /**
     * Stable row identity.
     */
    readonly id: string;
    /**
     * Caller-owned row payload.
     */
    readonly data: T;
    /**
     * Marks the row as selected for visual and assistive-technology state.
     */
    readonly selected?: boolean;
    /**
     * Destination that renders the row as a Fresh client-navigation link.
     */
    readonly href: string;
    readonly onSelect?: never;
  };

/**
 * Props accepted by {@link DataGrid}.
 */
export interface DataGridProps<T> {
  /**
   * Ordered column definitions.
   */
  readonly columns: readonly DataGridColumn<T>[];
  /**
   * Ordered row definitions.
   */
  readonly rows: readonly DataGridRow<T>[];
  /**
   * Additional class names appended to the grid root.
   */
  readonly class?: string;
  /**
   * Accessible label for the grid region.
   */
  readonly label?: string;
  /** Controlled selected row identities. Supplying this enables selection chrome. */
  readonly selectedIds?: ReadonlySet<string>;
  /** Receives the complete next controlled selection set. */
  readonly onSelectionChange?: (selectedIds: ReadonlySet<string>) => void;
  /** Renders bulk actions when at least one row is selected. */
  readonly renderBulkActions?: (selection: DataGridSelectionContext) => DataGridRenderable;
  /** Renders isolated actions for a row, typically an ActionMenu. */
  readonly renderRowActions?: (
    row: T,
    context: DataGridRowActionContext<T>,
  ) => DataGridRenderable;
  /**
   * Additional native attributes forwarded to the grid root.
   */
  readonly [attribute: string]: unknown;
}

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
        { key: column.key, role: 'columnheader', class: 'ns-data-grid__header-cell' },
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
        role: 'toolbar',
        'aria-label': `${selectedCount} selected`,
      },
      renderBulkActions(selectionContext) as ComponentChildren,
    ) as DataGridNode);
  }
  children.push(
    h(
      'div',
      { role: 'rowgroup', class: 'ns-data-grid__head' },
      h('div', {
        role: 'row',
        class: 'ns-data-grid__row ns-data-grid__row--header',
        style: gridStyle,
      }, headCells as ComponentChildren),
    ) as DataGridNode,
    h(
      'div',
      { role: 'rowgroup', class: 'ns-data-grid__body' },
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
    { ...props, role: 'grid', 'aria-label': label, class: cn('ns-data-grid', className) },
    h(
      'div',
      { role: 'rowgroup', class: 'ns-data-grid__head' },
      h(
        'div',
        { role: 'row', class: 'ns-data-grid__row ns-data-grid__row--header', style: gridStyle },
        columns.map((column) =>
          h(
            'span',
            { key: column.key, role: 'columnheader', class: 'ns-data-grid__header-cell' },
            column.header,
          )
        ),
      ),
    ),
    h(
      'div',
      { role: 'rowgroup', class: 'ns-data-grid__body' },
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
    { role: 'gridcell', class: 'ns-data-grid__selection' },
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
  cells.push(...columns.map((column) => renderDataGridCell(row.data, column)));
  if (renderRowActions) {
    cells.push(h('span', {
      role: 'gridcell',
      class: 'ns-data-grid__actions',
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
      class: cn(
        'ns-data-grid__row',
        selected && 'is-selected',
        (row.onSelect || row.href) && 'ns-data-grid__row--interactive',
      ),
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
    row.href
      ? h('a', {
        href: row.href,
        'f-client-nav': true,
        class: 'ns-data-grid__row-link',
        'aria-label': `Open row ${row.id}`,
      })
      : null,
  ) as DataGridNode;
}

function renderDataGridRow<T>(
  row: DataGridRow<T>,
  columns: readonly DataGridColumn<T>[],
  gridStyle: JSX.CSSProperties,
): DataGridNode {
  const rowClass = cn(
    'ns-data-grid__row',
    row.selected && 'is-selected',
    row.onSelect && 'ns-data-grid__row--button',
    row.href && 'ns-data-grid__row--link',
  );
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
      class: cn('ns-data-grid__cell', column.cell && `ns-data-grid__cell--${column.cell}`),
    },
    renderCellContent(content, column.cell) as ComponentChildren,
  ) as DataGridNode;
}

function renderCellContent(
  content: DataGridRenderable,
  variant: DataGridCellVariant | undefined,
): DataGridRenderable {
  if (variant === 'strong') {
    return h('strong', { class: 'ns-data-grid__cell-strong' }, content as ComponentChildren);
  }

  if (variant === 'num') {
    return h('span', { class: 'ns-data-grid__cell-num' }, content as ComponentChildren);
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
