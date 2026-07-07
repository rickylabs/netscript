/**
 * @module
 * Safe generative-UI renderer for `render_ui` tool payloads.
 */

import type { ComponentChildren } from 'preact';
import type { RenderUiToolInput } from '@netscript/ai/tools';
export type { RenderUiToolInput } from '@netscript/ai/tools';

/**
 * Maximum recursive block depth accepted by the generative-UI renderer.
 */
export const RENDER_UI_MAX_DEPTH = 6;

/**
 * Curated block categories accepted by the generative-UI renderer.
 */
export type RenderUiBlockCategory = 'layout' | 'viz' | 'data';

/**
 * Curated block type names accepted by the generative-UI renderer.
 */
export type RenderUiBlockType =
  | 'stack'
  | 'grid'
  | 'section'
  | 'chart'
  | 'metric'
  | 'table'
  | 'list'
  | 'card';

/**
 * Named fallback reasons emitted when a payload cannot be rendered safely.
 */
export type RenderUiFallbackReason = 'max-depth' | 'unknown-type' | 'invalid-node';

/**
 * Structural Preact node returned by the generative-UI renderer.
 */
export interface RenderUiNode {
  /**
   * Render target for the generated node.
   */
  readonly type: unknown;
  /**
   * Props attached to the generated node.
   */
  readonly props: unknown;
  /**
   * Optional key attached to the generated node.
   */
  readonly key: unknown;
}

/**
 * Public category-to-block vocabulary used by the renderer whitelist.
 */
export const RENDER_UI_BLOCK_CATEGORIES: Readonly<
  Record<RenderUiBlockCategory, readonly string[]>
> = Object.freeze({
  layout: Object.freeze(['stack', 'grid', 'section']),
  viz: Object.freeze(['chart', 'metric']),
  data: Object.freeze(['table', 'list', 'card']),
});

/**
 * Options for {@link renderUiPayload}.
 */
export interface RenderUiOptions {
  /**
   * Maximum recursive depth before a safe fallback is rendered.
   */
  readonly maxDepth?: number;
}

/**
 * Props accepted by {@link RenderUiSurface}.
 */
export interface RenderUiSurfaceProps extends RenderUiOptions {
  /**
   * Validated `render_ui` tool input from `@netscript/ai/tools`.
   */
  readonly payload: RenderUiToolInput;
}

type RenderContext = {
  readonly maxDepth: number;
};

const BLOCK_TYPES = new Set<string>([
  ...RENDER_UI_BLOCK_CATEGORIES.layout,
  ...RENDER_UI_BLOCK_CATEGORIES.viz,
  ...RENDER_UI_BLOCK_CATEGORIES.data,
]);

const LAYOUT_TYPES = new Set<string>(RENDER_UI_BLOCK_CATEGORIES.layout);
const VIZ_TYPES = new Set<string>(RENDER_UI_BLOCK_CATEGORIES.viz);
const DATA_TYPES = new Set<string>(RENDER_UI_BLOCK_CATEGORIES.data);

/**
 * Renders a validated `render_ui` payload into safe, bounded Preact DOM.
 *
 * @param payload - The `render_ui` input validated by `@netscript/ai/tools`.
 * @param options - Optional renderer guard configuration.
 * @returns A Preact node using only the curated Fresh UI block vocabulary.
 *
 * @example
 * ```tsx
 * import { renderUiPayload } from "@netscript/fresh-ui";
 *
 * const node = renderUiPayload({
 *   component: "stack",
 *   props: {
 *     children: [{ type: "metric", props: { label: "Latency", value: "42 ms" } }],
 *   },
 * });
 * ```
 */
export function renderUiPayload(
  payload: RenderUiToolInput,
  options: RenderUiOptions = {},
): RenderUiNode {
  return renderBlock(
    payload.component,
    payload.props ?? {},
    payload.title,
    0,
    { maxDepth: normalizeMaxDepth(options.maxDepth) },
  );
}

/**
 * Component wrapper around {@link renderUiPayload} for JSX call sites.
 *
 * @param props - A validated payload plus optional guard settings.
 * @returns A Preact node using only the curated Fresh UI block vocabulary.
 *
 * @example
 * ```tsx
 * import { RenderUiSurface } from "@netscript/fresh-ui";
 *
 * <RenderUiSurface payload={{ component: "card", title: "Summary" }} />;
 * ```
 */
export function RenderUiSurface(props: RenderUiSurfaceProps): RenderUiNode {
  return renderUiPayload(props.payload, { maxDepth: props.maxDepth });
}

function normalizeMaxDepth(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) return RENDER_UI_MAX_DEPTH;
  return Math.floor(value);
}

function renderNode(node: unknown, depth: number, context: RenderContext): ComponentChildren {
  if (depth > context.maxDepth) {
    return renderFallback('max-depth');
  }
  if (isPrimitive(node)) return node;
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <span class='ns-render-ui__fragment' data-index={index}>
        {renderNode(child, depth + 1, context)}
      </span>
    ));
  }
  if (!isRecord(node)) {
    return renderFallback('invalid-node');
  }

  const type = readString(node, 'type') ?? readString(node, 'component');
  if (type === undefined) return renderFallback('invalid-node');
  const props = readRecord(node, 'props') ?? node;
  return renderBlock(type, props, readString(node, 'title'), depth, context);
}

function renderBlock(
  type: string,
  props: Readonly<Record<string, unknown>>,
  title: string | undefined,
  depth: number,
  context: RenderContext,
): RenderUiNode {
  if (depth > context.maxDepth) {
    return renderFallback('max-depth');
  }
  if (!BLOCK_TYPES.has(type)) {
    return renderFallback('unknown-type');
  }
  if (LAYOUT_TYPES.has(type)) return renderLayoutBlock(type, props, title, depth, context);
  if (VIZ_TYPES.has(type)) return renderVizBlock(type, props, title);
  if (DATA_TYPES.has(type)) return renderDataBlock(type, props, title, depth, context);
  return renderFallback('unknown-type');
}

function renderLayoutBlock(
  type: string,
  props: Readonly<Record<string, unknown>>,
  title: string | undefined,
  depth: number,
  context: RenderContext,
): RenderUiNode {
  const children = renderChildren(props, depth, context);
  if (type === 'grid') {
    return (
      <div class='ns-grid ns-render-ui ns-render-ui--layout' data-render-ui-type='grid'>
        {title ? <h3 class='ns-render-ui__title'>{title}</h3> : null}
        {children}
      </div>
    );
  }
  if (type === 'section') {
    return (
      <section
        class='ns-section ns-stack ns-render-ui ns-render-ui--layout'
        data-render-ui-type='section'
      >
        {title ? <h2 class='ns-render-ui__title'>{title}</h2> : null}
        {children}
      </section>
    );
  }
  return (
    <div class='ns-stack ns-render-ui ns-render-ui--layout' data-render-ui-type='stack'>
      {title ? <h3 class='ns-render-ui__title'>{title}</h3> : null}
      {children}
    </div>
  );
}

function renderVizBlock(
  type: string,
  props: Readonly<Record<string, unknown>>,
  title: string | undefined,
): RenderUiNode {
  if (type === 'chart') {
    const rows = readArray(props, 'data')
      .map(normalizeChartDatum)
      .filter(isChartDatum);
    const max = Math.max(1, ...rows.map((row) => row.value));
    return (
      <div class='ns-chart ns-render-ui ns-render-ui--viz' data-render-ui-type='chart'>
        {title ? <div class='ns-chart__title'>{title}</div> : null}
        {rows.map((row) => (
          <div class='ns-chart__row'>
            <span class='ns-chart__label'>{row.label}</span>
            <span class='ns-chart__track'>
              <span class='ns-chart__bar' style={{ width: `${(row.value / max) * 100}%` }} />
            </span>
            <span class='ns-chart__value'>{formatNumber(row.value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <article
      class='ns-card ns-stats-grid__card ns-render-ui ns-render-ui--viz'
      data-render-ui-type='metric'
    >
      <div class='ns-card__body ns-stack ns-stack--sm ns-stats-grid__body'>
        <div class='ns-stats-grid__header'>
          <span class='ns-stats-grid__label'>
            {readString(props, 'label') ?? title ?? 'Metric'}
          </span>
        </div>
        <p class='ns-stats-grid__value'>{readText(props, 'value') ?? '0'}</p>
        {readText(props, 'detail')
          ? <p class='ns-stats-grid__detail'>{readText(props, 'detail')}</p>
          : null}
      </div>
    </article>
  );
}

function renderDataBlock(
  type: string,
  props: Readonly<Record<string, unknown>>,
  title: string | undefined,
  depth: number,
  context: RenderContext,
): RenderUiNode {
  if (type === 'table') return renderTableBlock(props, title);
  if (type === 'list') {
    return (
      <ul class='ns-render-ui ns-render-ui--data ns-render-ui__list' data-render-ui-type='list'>
        {title ? <li class='ns-render-ui__title'>{title}</li> : null}
        {readArray(props, 'items').map((item) => (
          <li class='ns-render-ui__list-item'>{renderNode(item, depth + 1, context)}</li>
        ))}
      </ul>
    );
  }
  return (
    <article class='ns-card ns-render-ui ns-render-ui--data' data-render-ui-type='card'>
      {title
        ? (
          <div class='ns-card__header'>
            <p class='ns-card__title'>{title}</p>
          </div>
        )
        : null}
      <div class='ns-card__body'>{renderChildren(props, depth, context)}</div>
    </article>
  );
}

function renderTableBlock(
  props: Readonly<Record<string, unknown>>,
  title: string | undefined,
): RenderUiNode {
  const columns = readArray(props, 'columns').map(normalizeColumn).filter(isColumn);
  const rows = readArray(props, 'rows').filter(isRecord);

  return (
    <div class='ns-data-table ns-render-ui ns-render-ui--data' data-render-ui-type='table'>
      {title ? <div class='ns-data-table__header'>{title}</div> : null}
      <div class='ns-data-table__body'>
        {columns.length > 0
          ? (
            <div class='ns-data-table__row ns-data-table__row--header'>
              {columns.map((column) => <span key={column.key}>{column.header}</span>)}
            </div>
          )
          : null}
        {rows.map((row, index) => (
          <div class='ns-data-table__row' key={index}>
            {columns.map((column) => <span key={column.key}>{readCell(row, column.key)}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderChildren(
  props: Readonly<Record<string, unknown>>,
  depth: number,
  context: RenderContext,
): ComponentChildren {
  const children = props.children ?? props.items ?? props.content;
  if (children === undefined) return null;
  return renderNode(children, depth + 1, context);
}

function renderFallback(reason: RenderUiFallbackReason): RenderUiNode {
  return (
    <div
      role='status'
      class='ns-render-ui-fallback'
      data-render-ui-fallback={reason}
    >
      Unable to render generated UI.
    </div>
  );
}

type ChartDatum = {
  readonly label: string;
  readonly value: number;
};

type Column = {
  readonly key: string;
  readonly header: string;
};

function normalizeChartDatum(value: unknown): ChartDatum | undefined {
  if (!isRecord(value)) return undefined;
  const label = readString(value, 'label');
  const rawValue = value.value;
  if (label === undefined || typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
    return undefined;
  }
  return { label, value: rawValue };
}

function isChartDatum(value: ChartDatum | undefined): value is ChartDatum {
  return value !== undefined;
}

function normalizeColumn(value: unknown): Column | undefined {
  if (typeof value === 'string' && value.length > 0) return { key: value, header: value };
  if (!isRecord(value)) return undefined;
  const key = readString(value, 'key');
  if (key === undefined) return undefined;
  return { key, header: readString(value, 'header') ?? key };
}

function isColumn(value: Column | undefined): value is Column {
  return value !== undefined;
}

function readCell(row: Readonly<Record<string, unknown>>, key: string): ComponentChildren {
  const value = row[key];
  return isPrimitive(value) ? value : '';
}

function readText(record: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = record[key];
  if (isPrimitive(value)) return String(value);
  return undefined;
}

function readString(record: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readRecord(
  record: Readonly<Record<string, unknown>>,
  key: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function readArray(record: Readonly<Record<string, unknown>>, key: string): readonly unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitive(
  value: unknown,
): value is string | number | bigint | boolean | null | undefined {
  return value === null || value === undefined || typeof value === 'string' ||
    typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean';
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
