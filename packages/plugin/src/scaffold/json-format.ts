/**
 * Deterministic JSON printer matching `deno fmt` output for plugin manifests.
 *
 * The printer is internal to the scaffold surface. It exists so a typed manifest object can be
 * rendered to bytes that are identical to a committed, `deno fmt`-formatted `scaffold.plugin.json`,
 * without shelling out to `deno fmt` at scaffold time.
 */

/** Maximum line width before arrays expand onto multiple lines (matches `deno fmt`). */
const LINE_WIDTH = 100;

/** Indentation width in spaces (matches the repo `deno fmt` config). */
const INDENT_WIDTH = 2;

/** Any JSON-serializable value accepted by the manifest printer. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonArray
  | JsonObject;

/** A JSON array of {@linkcode JsonValue} entries (readonly-compatible). */
export interface JsonArray extends ReadonlyArray<JsonValue> {}

/** A JSON object keyed by string with {@linkcode JsonValue} entries (readonly-compatible). */
export interface JsonObject {
  /** The value stored under an arbitrary string key. */
  readonly [key: string]: JsonValue;
}

/**
 * Recursively normalize an arbitrary value into a {@linkcode JsonValue}.
 *
 * This rebuilds plain JSON structure (objects, arrays, primitives) from `readonly` typed inputs so
 * the printer can consume them without any type cast. Object keys with an `undefined` value are
 * omitted, matching `JSON.stringify` semantics. Any non-JSON value (function, symbol, bigint,
 * `undefined` at the top level) throws, since manifests must be pure JSON.
 *
 * @param value The value to normalize.
 * @returns A {@linkcode JsonValue} structurally equal to the JSON projection of `value`.
 */
export function normalizeJson(value: unknown): JsonValue {
  if (value === null) {
    return null;
  }
  if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJson(item));
  }
  if (typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = normalizeJson(item);
      }
    }
    return result;
  }
  throw new TypeError(`Cannot normalize non-JSON value of type ${typeof value}.`);
}

/**
 * Format a typed manifest object as `deno fmt`-equivalent JSON text with a trailing newline.
 *
 * Objects always render one entry per line; arrays collapse to a single line when the full line
 * (including the property key prefix) fits within {@linkcode LINE_WIDTH}, otherwise they expand.
 *
 * @param value The JSON value to format.
 * @returns The formatted JSON text, terminated by a single newline.
 */
export function formatManifestJson(value: JsonValue): string {
  return `${printValue(value, 0, 0)}\n`;
}

/** Render a value inline (single line) with no surrounding whitespace. */
function inlineValue(value: JsonValue): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : `[${value.map(inlineValue).join(', ')}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return '{}';
  }
  return `{ ${
    entries.map(([key, item]) => `${JSON.stringify(key)}: ${inlineValue(item)}`).join(', ')
  } }`;
}

/**
 * Render a value, expanding objects (always) and arrays (when they exceed the line width).
 *
 * @param value The JSON value to print.
 * @param indentLevel The current nesting depth.
 * @param column The number of characters already on the current line before this value.
 */
function printValue(value: JsonValue, indentLevel: number, column: number): string {
  if (
    value === null || typeof value === 'boolean' || typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return inlineValue(value);
  }

  const pad = ' '.repeat(indentLevel * INDENT_WIDTH);
  const childPad = ' '.repeat((indentLevel + 1) * INDENT_WIDTH);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const oneLine = inlineValue(value);
    if (column + oneLine.length <= LINE_WIDTH) {
      return oneLine;
    }
    const items = value.map(
      (item) => `${childPad}${printValue(item, indentLevel + 1, childPad.length)}`,
    );
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return '{}';
  }
  const items = entries.map(([key, item]) => {
    const prefix = `${childPad}${JSON.stringify(key)}: `;
    return `${prefix}${printValue(item, indentLevel + 1, prefix.length)}`;
  });
  return `{\n${items.join(',\n')}\n${pad}}`;
}
