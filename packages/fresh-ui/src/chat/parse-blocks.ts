/**
 * @module @netscript/fresh-ui/chat/parse-blocks
 *
 * Fenced generative-UI block parser for assistant chat markdown.
 *
 * Assistant responses embed data-visualisation blocks as fenced code with a
 * curated info-string (` ```chart `, ` ```donut `, ` ```table `, ` ```stats `,
 * ` ```line `). {@linkcode parseBlocks} projects that markdown into a typed
 * {@linkcode RenderPart} tree whose block members carry the exact prop shapes
 * of the corresponding Fresh UI design-system primitives (chart-block, donut,
 * data-table/responsive-table, stats-grid, and a self-contained line series),
 * while non-fenced prose and any malformed fence fall back to a `text` part.
 *
 * The union is owned here and defined self-contained — it intentionally does
 * not import from `@netscript/fresh/ai`. Curated vocabulary lives in fresh-ui;
 * apps never hand-roll block parsing.
 *
 * ## Reload-fidelity guarantee
 *
 * {@linkcode blockToText} is the inverse projection back to canonical markdown
 * (single-line JSON bodies), and it doubles as a plain-text export / fallback.
 * For every input the parser is a fixed point after one normalisation:
 *
 * ```ts
 * const first = parseBlocks(input);
 * const reloaded = parseBlocks(first.map(blockToText).join(''));
 * // reloaded is deep-equal to first — chat sessions survive reload w/o drift.
 * ```
 */

/**
 * Semantic tone shared by chart, donut, and series data points. Mirrors the
 * `ChartTone` / `DonutTone` unions on the chart-block and donut primitives.
 */
export type RenderTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary';

const RENDER_TONES: ReadonlySet<string> = new Set<RenderTone>([
  'primary',
  'success',
  'warning',
  'destructive',
  'secondary',
]);

/** Horizontal alignment for a table column. Mirrors `ResponsiveTableAlign`. */
export type TableAlign = 'start' | 'center' | 'end';

/**
 * A single chart/donut data point. Structurally matches the `ChartDatum` and
 * `DonutDatum` prop shapes of the chart-block and donut primitives.
 */
export interface ChartDatum {
  /** Category label for the bar/segment. */
  label: string;
  /** Numeric magnitude driving the bar length or segment arc. */
  value: number;
  /** Optional semantic tone for the bar/segment. */
  tone?: RenderTone;
}

/** Alias for donut segment data — identical shape to {@linkcode ChartDatum}. */
export type DonutDatum = ChartDatum;

/** A single point in a line series (x category, y magnitude). */
export interface LinePoint {
  /** X-axis category (e.g. a time bucket or label). */
  x: string;
  /** Y-axis magnitude at this point. */
  y: number;
}

/** A table column descriptor — the serialisable subset of `ResponsiveTableColumn`. */
export interface TableColumn {
  /** Stable key used to address this column's cell in a {@linkcode TableRow}. */
  key: string;
  /** Human-readable header label. */
  label: string;
  /** Optional horizontal alignment for the column. */
  align?: TableAlign;
}

/** A table row: cell values keyed by {@linkcode TableColumn.key}. */
export type TableRow = Record<string, string>;

/** A single stats-grid entry — the serialisable subset of `StatsCardProps`. */
export interface StatsEntry {
  /** Small uppercase metric label. */
  label: string;
  /** Primary metric value — a number, or a pre-formatted string (e.g. `$1.2k`). */
  value: string | number;
  /** Optional supporting detail below the value. */
  detail?: string;
}

/** Inline metric chart part — feeds the chart-block primitive's `data`. */
export interface ChartRenderPart {
  /** Discriminant. */
  kind: 'chart';
  /** Bars/segments to plot. */
  data: ChartDatum[];
  /** Optional chart title. */
  title?: string;
  /** Optional chart subtitle. */
  sub?: string;
  /** Optional value unit suffix (e.g. `/h`). */
  unit?: string;
  /** Optional layout: horizontal `bar` (default) or vertical `column`. */
  variant?: 'bar' | 'column';
}

/** Donut/pie chart part — feeds the donut primitive's `data`/`total`. */
export interface DonutRenderPart {
  /** Discriminant. */
  kind: 'donut';
  /** Segments to plot. */
  data: DonutDatum[];
  /** Optional center label; defaults to the sum of segment values. */
  total?: string | number;
}

/** Tabular part — feeds a responsive-table's `columns`/`rows`. */
export interface TableRenderPart {
  /** Discriminant. */
  kind: 'table';
  /** Ordered column descriptors. */
  columns: TableColumn[];
  /** Row data, each cell keyed by {@linkcode TableColumn.key}. */
  rows: TableRow[];
  /** Optional table caption. */
  caption?: string;
}

/** Summary-metric grid part — feeds stats-grid cards. */
export interface StatsRenderPart {
  /** Discriminant. */
  kind: 'stats';
  /** Metric cards to render in the grid. */
  items: StatsEntry[];
}

/** Line-series part — a self-contained metric trend (no upstream primitive). */
export interface LineRenderPart {
  /** Discriminant. */
  kind: 'line';
  /** Ordered series points. */
  points: LinePoint[];
  /** Optional chart title. */
  title?: string;
  /** Optional chart subtitle. */
  sub?: string;
  /** Optional value unit suffix. */
  unit?: string;
}

/** Non-fenced prose, or the verbatim fallback for a malformed fence. */
export interface TextRenderPart {
  /** Discriminant. */
  kind: 'text';
  /** Verbatim prose (or the raw text of a malformed fence). */
  text: string;
}

/**
 * Discriminated union of every renderable chat part. `text` is the fallback
 * member for prose and for any fence that fails to parse.
 */
export type RenderPart =
  | ChartRenderPart
  | DonutRenderPart
  | TableRenderPart
  | StatsRenderPart
  | LineRenderPart
  | TextRenderPart;

/** Fenced info-strings recognised as generative-UI blocks. */
type BlockKind = 'chart' | 'donut' | 'table' | 'stats' | 'line';

/**
 * Matches a well-formed fenced block whose info-string is a curated kind.
 *
 * - Group 1: the block kind (info-string word).
 * - Group 2: the block body (excludes the opening/closing fence lines and the
 *   newline immediately preceding the closing fence).
 *
 * The opening `^` and trailing `$` are line anchors (`m` flag); the match never
 * consumes the newline that follows the closing fence, so that separator stays
 * with the adjacent text run and reconstruction is boundary-stable.
 */
const FENCE_RE = /^```(chart|donut|table|stats|line)[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```[^\S\r\n]*$/gm;

/**
 * Parses assistant markdown into a typed {@linkcode RenderPart} tree.
 *
 * Recognised fenced blocks become the matching typed part; a fence with an
 * unparseable body falls back to a verbatim `text` part (never throws); all
 * other prose becomes `text` parts. Adjacent parts are never merged, so the
 * projection is a boundary-stable fixed point under {@linkcode blockToText}.
 */
export function parseBlocks(input: string): RenderPart[] {
  const parts: RenderPart[] = [];
  let cursor = 0;

  for (const match of input.matchAll(FENCE_RE)) {
    const start = match.index;
    if (start > cursor) pushText(parts, input.slice(cursor, start));

    const kind = match[1] as BlockKind;
    const block = parseFencedBody(kind, match[2]);
    if (block) parts.push(block);
    else pushText(parts, match[0]);

    cursor = start + match[0].length;
  }

  if (cursor < input.length) pushText(parts, input.slice(cursor));
  return parts;
}

/**
 * Projects a {@linkcode RenderPart} back to canonical markdown text.
 *
 * `text` parts round-trip verbatim; block parts emit a fence with a
 * single-line canonical JSON body. Joining `parseBlocks(input).map(blockToText)`
 * yields markdown that re-parses deep-equal to the original parse, and also
 * serves as a plain-text export / non-visual fallback.
 */
export function blockToText(part: RenderPart): string {
  switch (part.kind) {
    case 'text':
      return part.text;
    case 'chart':
      return fence('chart', chartPayload(part));
    case 'donut':
      return fence('donut', donutPayload(part));
    case 'table':
      return fence('table', tablePayload(part));
    case 'stats':
      return fence('stats', statsPayload(part));
    case 'line':
      return fence('line', linePayload(part));
  }
}

// ── internals ────────────────────────────────────────────────────────────────

function pushText(parts: RenderPart[], text: string): void {
  if (text.length > 0) parts.push({ kind: 'text', text });
}

function fence(kind: BlockKind, payload: unknown): string {
  return '```' + kind + '\n' + JSON.stringify(payload) + '\n```';
}

/**
 * Parses a fenced body for `kind`, trying canonical JSON first and the minimal
 * line/pipe DSL second. Returns `null` when neither yields a valid part.
 */
function parseFencedBody(kind: BlockKind, body: string): RenderPart | null {
  const json = tryJson(body);
  const fromJson = json === undefined ? null : normalize(kind, json);
  if (fromJson) return fromJson;

  const dsl = parseDsl(kind, body);
  return dsl ? normalize(kind, dsl) : null;
}

function tryJson(body: string): unknown {
  const trimmed = body.trim();
  if (trimmed.length === 0) return undefined;
  const first = trimmed[0];
  if (first !== '{' && first !== '[') return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function normalize(kind: BlockKind, raw: unknown): RenderPart | null {
  switch (kind) {
    case 'chart':
      return normalizeChart(raw);
    case 'donut':
      return normalizeDonut(raw);
    case 'table':
      return normalizeTable(raw);
    case 'stats':
      return normalizeStats(raw);
    case 'line':
      return normalizeLine(raw);
  }
}

// ── chart / donut ────────────────────────────────────────────────────────────

function normalizeChart(raw: unknown): ChartRenderPart | null {
  const source = asRecordOrArray(raw);
  if (!source) return null;
  const data = normalizeChartData(Array.isArray(raw) ? raw : source.data);
  if (!data) return null;

  const part: ChartRenderPart = { kind: 'chart', data };
  const title = asText(source.title);
  if (title !== undefined) part.title = title;
  const sub = asText(source.sub);
  if (sub !== undefined) part.sub = sub;
  const unit = asText(source.unit);
  if (unit !== undefined) part.unit = unit;
  if (source.variant === 'bar' || source.variant === 'column') {
    part.variant = source.variant;
  }
  return part;
}

function normalizeDonut(raw: unknown): DonutRenderPart | null {
  const source = asRecordOrArray(raw);
  if (!source) return null;
  const data = normalizeChartData(Array.isArray(raw) ? raw : source.data);
  if (!data) return null;

  const part: DonutRenderPart = { kind: 'donut', data };
  const total = source.total;
  if (typeof total === 'string' || (typeof total === 'number' && Number.isFinite(total))) {
    part.total = total;
  }
  return part;
}

function normalizeChartData(raw: unknown): ChartDatum[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const data: ChartDatum[] = [];
  for (const entry of raw) {
    if (entry === null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const label = asText(record.label);
    const value = asFiniteNumber(record.value);
    if (label === undefined || value === undefined) return null;
    const datum: ChartDatum = { label, value };
    const tone = asTone(record.tone);
    if (tone) datum.tone = tone;
    data.push(datum);
  }
  return data;
}

// ── line ─────────────────────────────────────────────────────────────────────

function normalizeLine(raw: unknown): LineRenderPart | null {
  const source = asRecordOrArray(raw);
  if (!source) return null;
  const points = normalizeLinePoints(Array.isArray(raw) ? raw : source.points);
  if (!points) return null;

  const part: LineRenderPart = { kind: 'line', points };
  const title = asText(source.title);
  if (title !== undefined) part.title = title;
  const sub = asText(source.sub);
  if (sub !== undefined) part.sub = sub;
  const unit = asText(source.unit);
  if (unit !== undefined) part.unit = unit;
  return part;
}

function normalizeLinePoints(raw: unknown): LinePoint[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const points: LinePoint[] = [];
  for (const entry of raw) {
    if (entry === null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const x = asText(record.x);
    const y = asFiniteNumber(record.y);
    if (x === undefined || y === undefined) return null;
    points.push({ x, y });
  }
  return points;
}

// ── stats ────────────────────────────────────────────────────────────────────

function normalizeStats(raw: unknown): StatsRenderPart | null {
  const source = asRecordOrArray(raw);
  if (!source) return null;
  const rawItems = Array.isArray(raw) ? raw : source.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) return null;

  const items: StatsEntry[] = [];
  for (const entry of rawItems) {
    if (entry === null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const label = asText(record.label);
    const value = asStatsValue(record.value);
    if (label === undefined || value === undefined) return null;
    const item: StatsEntry = { label, value };
    const detail = asText(record.detail);
    if (detail !== undefined) item.detail = detail;
    items.push(item);
  }
  return { kind: 'stats', items };
}

// ── table ────────────────────────────────────────────────────────────────────

function normalizeTable(raw: unknown): TableRenderPart | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const columns = normalizeColumns(record.columns);
  if (!columns) return null;
  const rows = normalizeRows(record.rows, columns);
  if (!rows) return null;

  const part: TableRenderPart = { kind: 'table', columns, rows };
  const caption = asText(record.caption);
  if (caption !== undefined) part.caption = caption;
  return part;
}

function normalizeColumns(raw: unknown): TableColumn[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const columns: TableColumn[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') {
      columns.push({ key: entry, label: entry });
      continue;
    }
    if (entry === null || typeof entry !== 'object') return null;
    const record = entry as Record<string, unknown>;
    const key = asText(record.key);
    const label = asText(record.label);
    if (key === undefined || label === undefined) return null;
    const column: TableColumn = { key, label };
    const align = asAlign(record.align);
    if (align) column.align = align;
    columns.push(column);
  }
  return columns;
}

function normalizeRows(raw: unknown, columns: TableColumn[]): TableRow[] | null {
  if (!Array.isArray(raw)) return null;
  const rows: TableRow[] = [];
  for (const entry of raw) {
    const row: TableRow = {};
    if (Array.isArray(entry)) {
      columns.forEach((column, index) => {
        row[column.key] = asCell(entry[index]);
      });
    } else if (entry !== null && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      for (const column of columns) row[column.key] = asCell(record[column.key]);
    } else {
      return null;
    }
    rows.push(row);
  }
  return rows;
}

// ── minimal DSL ──────────────────────────────────────────────────────────────

/** Dispatches to the per-kind minimal DSL; returns a raw object or `null`. */
function parseDsl(kind: BlockKind, body: string): unknown {
  switch (kind) {
    case 'chart':
    case 'donut': {
      const data = parseKeyValueLines(body);
      return data ? { data } : null;
    }
    case 'line': {
      const points = parsePointLines(body);
      return points ? { points } : null;
    }
    case 'stats': {
      const items = parseStatsLines(body);
      return items ? { items } : null;
    }
    case 'table':
      return parsePipeTable(body);
  }
}

const KV_LINE = /^(.+?):[^\S\r\n]*(-?\d+(?:\.\d+)?)[^\S\r\n]*(?:@([a-z]+))?$/;

function parseKeyValueLines(body: string): ChartDatum[] | null {
  const lines = nonBlankLines(body);
  if (lines.length === 0) return null;
  const data: ChartDatum[] = [];
  for (const line of lines) {
    const match = KV_LINE.exec(line.trim());
    if (!match) return null;
    const datum: ChartDatum = { label: match[1].trim(), value: Number(match[2]) };
    const tone = asTone(match[3]);
    if (tone) datum.tone = tone;
    data.push(datum);
  }
  return data;
}

function parsePointLines(body: string): LinePoint[] | null {
  const lines = nonBlankLines(body);
  if (lines.length === 0) return null;
  const points: LinePoint[] = [];
  for (const line of lines) {
    const match = KV_LINE.exec(line.trim());
    if (!match) return null;
    points.push({ x: match[1].trim(), y: Number(match[2]) });
  }
  return points;
}

const STATS_LINE = /^(.+?):[^\S\r\n]+(.+?)$/;

function parseStatsLines(body: string): StatsEntry[] | null {
  const lines = nonBlankLines(body);
  if (lines.length === 0) return null;
  const items: StatsEntry[] = [];
  for (const line of lines) {
    const match = STATS_LINE.exec(line.trim());
    if (!match) return null;
    items.push({ label: match[1].trim(), value: match[2].trim() });
  }
  return items;
}

function parsePipeTable(body: string): unknown {
  const lines = nonBlankLines(body).map((line) => line.trim());
  if (lines.length === 0 || !lines[0].includes('|')) return null;

  const header = splitPipeRow(lines[0]);
  if (header.length === 0) return null;

  let dataStart = 1;
  const aligns: (TableAlign | undefined)[] = header.map(() => undefined);
  if (lines.length > 1 && isSeparatorRow(lines[1])) {
    splitPipeRow(lines[1]).forEach((cell, index) => {
      if (index < aligns.length) aligns[index] = separatorAlign(cell);
    });
    dataStart = 2;
  }

  const usedKeys = new Set<string>();
  const columns: TableColumn[] = header.map((label, index) => {
    const column: TableColumn = { key: uniqueKey(label, index, usedKeys), label };
    if (aligns[index]) column.align = aligns[index];
    return column;
  });

  const rows: TableRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitPipeRow(lines[i]);
    const row: TableRow = {};
    columns.forEach((column, index) => {
      row[column.key] = (cells[index] ?? '').trim();
    });
    rows.push(row);
  }

  return { columns, rows };
}

function splitPipeRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  const cells = splitPipeRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function separatorAlign(cell: string): TableAlign | undefined {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'end';
  if (left) return 'start';
  return undefined;
}

function uniqueKey(label: string, index: number, used: Set<string>): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    `col-${index + 1}`;
  let key = base;
  let suffix = 2;
  while (used.has(key)) key = `${base}-${suffix++}`;
  used.add(key);
  return key;
}

function nonBlankLines(body: string): string[] {
  return body.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

// ── coercion helpers ─────────────────────────────────────────────────────────

function asRecordOrArray(raw: unknown): Record<string, unknown> | null {
  if (Array.isArray(raw)) return {};
  if (raw !== null && typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStatsValue(value: unknown): string | number | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function asTone(value: unknown): RenderTone | undefined {
  return typeof value === 'string' && RENDER_TONES.has(value) ? value as RenderTone : undefined;
}

function asAlign(value: unknown): TableAlign | undefined {
  return value === 'start' || value === 'center' || value === 'end' ? value : undefined;
}

function asCell(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  return '';
}

// ── canonical payload builders (inverse projection) ──────────────────────────

function chartPayload(part: ChartRenderPart): Record<string, unknown> {
  const payload: Record<string, unknown> = { data: part.data };
  if (part.title !== undefined) payload.title = part.title;
  if (part.sub !== undefined) payload.sub = part.sub;
  if (part.unit !== undefined) payload.unit = part.unit;
  if (part.variant !== undefined) payload.variant = part.variant;
  return payload;
}

function donutPayload(part: DonutRenderPart): Record<string, unknown> {
  const payload: Record<string, unknown> = { data: part.data };
  if (part.total !== undefined) payload.total = part.total;
  return payload;
}

function tablePayload(part: TableRenderPart): Record<string, unknown> {
  const payload: Record<string, unknown> = { columns: part.columns, rows: part.rows };
  if (part.caption !== undefined) payload.caption = part.caption;
  return payload;
}

function statsPayload(part: StatsRenderPart): Record<string, unknown> {
  return { items: part.items };
}

function linePayload(part: LineRenderPart): Record<string, unknown> {
  const payload: Record<string, unknown> = { points: part.points };
  if (part.title !== undefined) payload.title = part.title;
  if (part.sub !== undefined) payload.sub = part.sub;
  if (part.unit !== undefined) payload.unit = part.unit;
  return payload;
}
