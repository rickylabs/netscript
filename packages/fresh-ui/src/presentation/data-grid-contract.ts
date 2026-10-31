/** Public row, column and selection contracts for the DataGrid presentation. */
/**
 * Built-in cell treatments supported by {@link DataGridColumn}.
 */
export const DATA_GRID_CELL_VARIANTS = ['strong', 'num'] as const;

/**
 * Built-in cell treatment names supported by {@link DataGridColumn}.
 */
export type DataGridCellVariant = typeof DATA_GRID_CELL_VARIANTS[number];

/**
 * Structural node returned by `DataGrid`.
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
 * Column contract for `DataGrid`.
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
  /** Number of selected rows present in this grid. */
  readonly count: number;
  /** Controlled selected row identities. */
  readonly selectedIds: ReadonlySet<string>;
  /** Requests an empty controlled selection. */
  readonly clearSelection: () => void;
}

/** Typed context supplied to each DataGrid row-action slot. */
export interface DataGridRowActionContext<T> {
  /** Complete row contract associated with the action slot. */
  readonly row: DataGridRow<T>;
  /** Whether this row identity is in the controlled selection. */
  readonly selected: boolean;
}

/**
 * Plain, button, or Fresh client-navigation row contract for `DataGrid`.
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
 * Props accepted by `DataGrid`.
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
