/** Public row, column and selection contracts for the DataGrid presentation. */
/**
 * Built-in cell treatments supported by {@link DataGridColumn}.
 */
export const DATA_GRID_CELL_VARIANTS = ['strong', 'num'] as const;

/**
 * Built-in cell treatment names supported by {@link DataGridColumn}.
 */
export type DataGridCellVariant = typeof DATA_GRID_CELL_VARIANTS[number];

/** Body presentation; the host owns the rows and any empty or loading content. */
export type DataGridState = 'default' | 'selection' | 'empty' | 'loading';

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
   * Visible column header, including a caller-owned native sort control.
   */
  readonly header: DataGridRenderable;
  /** Mobile cell label; defaults to a string header, otherwise the column key. */
  readonly headerLabel?: string;
  /** Native header sort state; the host owns ordering and the header control. */
  readonly sort?: 'none' | 'ascending' | 'descending' | 'other';
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
     * Click handler for the native row activation button and row body hit area.
     */
    readonly onSelect: () => void;
    /** Accessible activation name; defaults to `Open row <id>`. */
    readonly label?: string;
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
     * Destination for the native row link and its row body hit area.
     */
    readonly href: string;
    /** Accessible activation name; defaults to `Open row <id>`. */
    readonly label?: string;
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
  /** Omit to derive empty, selection or default from the supplied rows and selection. */
  readonly state?: DataGridState;
  /** Caller-owned content in the spanning empty cell; absent content stays empty. */
  readonly empty?: DataGridRenderable;
  /** Caller-owned content in the spanning loading cell; absent content stays empty. */
  readonly loading?: DataGridRenderable;
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
