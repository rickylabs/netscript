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
    },
    h(
      'div',
      { role: 'rowgroup', class: 'ns-data-grid__head' },
      h(
        'div',
        {
          role: 'row',
          class: 'ns-data-grid__row ns-data-grid__row--header',
          style: gridStyle,
        },
        columns.map((column) =>
          h(
            'span',
            {
              key: column.key,
              role: 'columnheader',
              class: 'ns-data-grid__header-cell',
            },
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
