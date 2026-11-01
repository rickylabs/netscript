import { h } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { cn } from '../../registry/lib/cn.ts';
import { Icon } from './primitives.tsx';
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
  DataGridState,
} from './data-grid-contract.ts';
export { DATA_GRID_CELL_VARIANTS } from './data-grid-contract.ts';

const ROW_CONTROL_SELECTOR =
  'a,button,input,select,textarea,summary,label,[tabindex],[contenteditable],[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="combobox"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="menuitem"]';
const DEFAULT_COLUMN_TRACK = 'minmax(0, 1fr)';

/** Native table presentation with caller-owned data, content and controlled selection. */
export function DataGrid<T>(
  {
    columns,
    rows,
    class: className,
    label,
    state: requestedState,
    empty,
    loading,
    selectedIds,
    onSelectionChange,
    renderBulkActions,
    renderRowActions,
    ...props
  }: DataGridProps<T>,
): DataGridNode {
  const selected = selectedIds ?? new Set(rows.filter((row) => row.selected).map((row) => row.id));
  const state = requestedState ??
    (rows.length === 0
      ? 'empty'
      : rows.some((row) => selected.has(row.id))
      ? 'selection'
      : 'default');
  const bodyState = state === 'empty' || state === 'loading';
  const visibleRows = bodyState ? [] : rows;
  const ids = visibleRows.map((row) => row.id);
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;
  const selectionEnabled = selectedIds !== undefined || onSelectionChange !== undefined;
  const selectionContext: DataGridSelectionContext = {
    count: selectedCount,
    selectedIds: selected,
    clearSelection: () => onSelectionChange?.(new Set()),
  };
  const tracks = [
    selectionEnabled ? '2.5rem' : '',
    ...(columns.length
      ? columns.map((column) => column.width ?? DEFAULT_COLUMN_TRACK)
      : [DEFAULT_COLUMN_TRACK]),
    renderRowActions ? 'auto' : '',
  ].filter(Boolean).join(' ');
  const gridStyle: JSX.CSSProperties = { gridTemplateColumns: tracks };
  const columnCount = Math.max(
    1,
    Math.max(1, columns.length) + Number(selectionEnabled) + Number(Boolean(renderRowActions)),
  );
  const head: DataGridNode[] = [];
  if (selectionEnabled) {
    head.push(selectionCell({
      header: true,
      checked: allSelected,
      indeterminate: selectedCount > 0 && !allSelected,
      disabled: ids.length === 0,
      label: allSelected ? 'Clear selection' : 'Select all rows',
      onChange: () => onSelectionChange?.(new Set(allSelected ? [] : ids)),
    }));
  }
  head.push(...columns.map((column) =>
    h('th', {
      key: column.key,
      scope: 'col',
      role: 'columnheader',
      'aria-sort': column.sort,
      class: 'ns-data-grid__header-cell',
      'data-part': 'header-cell',
      'data-scope': 'data-table',
    }, column.header as ComponentChildren)
  ));
  if (columns.length === 0) {
    head.push(h('th', {
      scope: 'col',
      role: 'columnheader',
      'aria-label': label ?? 'Row',
      class: 'ns-data-grid__header-cell',
      'data-part': 'header-cell',
      'data-scope': 'data-table',
    }));
  }
  if (renderRowActions) {
    head.push(h('th', {
      scope: 'col',
      role: 'columnheader',
      'aria-label': 'Row actions',
      class: 'ns-data-grid__actions',
      'data-part': 'actions',
      'data-scope': 'data-table',
    }));
  }
  const body = bodyState
    ? [
      h(
        'tr',
        {
          role: 'row',
          class: 'ns-data-grid__status-row',
          'data-part': 'row',
          'data-scope': 'data-table',
        },
        h('td', {
          role: 'cell',
          colSpan: columnCount,
          class: 'ns-data-grid__status',
          'data-part': state,
          'data-scope': 'data-table',
        }, (state === 'loading' ? loading : empty) as ComponentChildren),
      ),
    ]
    : visibleRows.map((row) =>
      dataRow(
        row,
        columns,
        gridStyle,
        selected,
        onSelectionChange,
        selectionEnabled,
        renderRowActions,
      )
    );
  const children: DataGridNode[] = [];
  if (selectedCount > 0 && renderBulkActions) {
    children.push(h(
      'div',
      {
        role: 'group',
        'aria-label': `${selectedCount} selected`,
        class: 'ns-data-grid__bulk-actions',
        'data-part': 'bulk-actions',
        'data-scope': 'data-table',
      },
      h('div', {
        class: 'ns-data-grid__action-bar',
        'data-part': 'root',
        'data-scope': 'action-bar',
        'data-variant': 'inline',
      }, renderBulkActions(selectionContext) as ComponentChildren),
    ));
  }
  children.push(h(
    'table',
    {
      role: 'table',
      'aria-label': label,
      'aria-labelledby': props['aria-labelledby'],
      'aria-describedby': props['aria-describedby'],
      'aria-busy': state === 'loading' ? 'true' : undefined,
      class: 'ns-data-grid__table',
      // Wide containers share these tracks through native CSS subgrid.
      style: gridStyle,
      'data-part': 'table',
      'data-scope': 'data-table',
    },
    h(
      'thead',
      {
        role: 'rowgroup',
        class: 'ns-data-grid__head',
        'data-part': 'head',
        'data-scope': 'data-table',
      },
      h('tr', {
        role: 'row',
        class: 'ns-data-grid__row',
        'data-type': 'header',
        'data-part': 'row',
        'data-scope': 'data-table',
        style: gridStyle,
      }, head as ComponentChildren),
    ),
    h('tbody', {
      role: 'rowgroup',
      class: 'ns-data-grid__body',
      'data-part': 'body',
      'data-scope': 'data-table',
    }, body as ComponentChildren),
  ));
  return h('div', {
    ...props,
    class: cn('ns-data-grid', className),
    'data-part': 'root',
    'data-scope': 'data-table',
    'data-state': state,
  }, children as ComponentChildren);
}

interface SelectionOptions {
  header?: boolean;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}

/** Reconcile native properties before proposing selection so a refusal is physical. */
function selectionCell(options: SelectionOptions): DataGridNode {
  return h(
    options.header ? 'th' : 'td',
    {
      role: options.header ? 'columnheader' : 'cell',
      scope: options.header ? 'col' : undefined,
      class: 'ns-data-grid__selection',
      'data-part': 'selection',
      'data-scope': 'data-table',
    },
    h('input', {
      type: 'checkbox',
      checked: options.checked,
      disabled: options.disabled,
      'aria-label': options.label,
      'aria-checked': options.indeterminate ? 'mixed' : String(options.checked),
      ref: (element: HTMLInputElement | null) => {
        if (element) element.indeterminate = options.indeterminate;
      },
      onClick: (event: Event) => event.stopPropagation(),
      onChange: (event: JSX.TargetedEvent<HTMLInputElement>) => {
        event.currentTarget.checked = options.checked;
        event.currentTarget.indeterminate = options.indeterminate;
        options.onChange();
      },
    }),
  );
}

function dataRow<T>(
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
    cells.push(selectionCell({
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
  const activation = rowActivation(row);
  cells.push(...columns.map((column, index) => {
    const content = column.render
      ? column.render(row.data)
      : fallbackCellContent(row.data, column.key);
    return h(
      'td',
      {
        key: column.key,
        role: 'cell',
        class: 'ns-data-grid__cell',
        'data-part': 'cell',
        'data-scope': 'data-table',
        'data-variant': column.cell,
      },
      h('span', {
        class: 'ns-data-grid__cell-label',
        'data-part': 'cell-label',
        'data-scope': 'data-table',
        'aria-hidden': 'true',
      }, column.headerLabel ?? (typeof column.header === 'string' ? column.header : column.key)),
      renderCellContent(content, column.cell) as ComponentChildren,
      index === 0 ? activation as ComponentChildren : null,
    );
  }));
  if (columns.length === 0) {
    cells.push(
      h('td', {
        role: 'cell',
        class: 'ns-data-grid__cell',
        'data-part': 'cell',
        'data-scope': 'data-table',
      }, activation as ComponentChildren),
    );
  }
  if (renderRowActions) {
    cells.push(h('td', {
      role: 'cell',
      class: 'ns-data-grid__actions',
      'data-part': 'actions',
      'data-scope': 'data-table',
      onClick: (event: Event) => event.stopPropagation(),
    }, renderRowActions(row.data, { row, selected }) as ComponentChildren));
  }
  return h('tr', {
    key: row.id,
    role: 'row',
    class: 'ns-data-grid__row',
    style: gridStyle,
    'data-part': 'row',
    'data-scope': 'data-table',
    'data-state': selected ? 'selected' : undefined,
    'data-interactive': row.onSelect || row.href !== undefined ? 'true' : undefined,
    'data-type': row.onSelect ? 'button' : row.href !== undefined ? 'link' : undefined,
    onClick: activation ? activateRowFromPointer : undefined,
  }, cells as ComponentChildren);
}

/** Body clicks use the real control without intercepting native text selection or child controls. */
function activateRowFromPointer(event: JSX.TargetedMouseEvent<HTMLTableRowElement>): void {
  if (!event.isTrusted || event.defaultPrevented) return;
  if (event.type !== 'click' || event.button !== 0) return;
  if (event.shiftKey || event.altKey || (event.ctrlKey && event.metaKey)) return;
  const row = event.currentTarget;
  const target = event.target;
  if (
    !(target instanceof Element) || target.closest('tr') !== row ||
    target.closest(ROW_CONTROL_SELECTOR)
  ) return;
  const selection = row.ownerDocument.getSelection();
  if (
    selection && !selection.isCollapsed &&
    (row.contains(selection.anchorNode) || row.contains(selection.focusNode))
  ) return;
  const activation = Array.from(row.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
    '.ns-data-grid__row-action, .ns-data-grid__row-link',
  )).find((control) => control.closest('tr') === row);
  if (!activation) return;
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    activation.focus({ preventScroll: true });
  }
  if (activation instanceof HTMLAnchorElement && (event.ctrlKey || event.metaKey)) {
    const target = activation.getAttribute('target');
    try {
      activation.setAttribute('target', '_blank');
      activation.click();
    } finally {
      if (target === null) activation.removeAttribute('target');
      else activation.setAttribute('target', target);
    }
  } else activation.dispatchEvent(new MouseEvent(event.type, event));
  event.stopPropagation();
}

/** Real sibling control: arbitrary cell renderers are never nested in this action. */
function rowActivation<T>(row: DataGridRow<T>): DataGridNode | null {
  if (row.onSelect) {
    return h('button', {
      type: 'button',
      class: 'ns-data-grid__row-action',
      onClick: row.onSelect,
      'aria-label': row.label ?? `Open row ${row.id}`,
      'data-part': 'row-action',
      'data-scope': 'data-table',
    }, Icon({ name: 'arrow-right', size: 14 }) as ComponentChildren);
  }
  if (row.href !== undefined) {
    return h('a', {
      href: row.href,
      'f-client-nav': true,
      class: 'ns-data-grid__row-link',
      'aria-label': row.label ?? `Open row ${row.id}`,
      'data-part': 'row-link',
      'data-scope': 'data-table',
    }, Icon({ name: 'arrow-right', size: 14 }) as ComponentChildren);
  }
  return null;
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
  if (!row || typeof row !== 'object' || !(key in row)) return null;
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined || typeof value === 'boolean') return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}
