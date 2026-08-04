const objectSchema = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
): Readonly<Record<string, unknown>> => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
const stringProperty = { type: 'string' } as const;
const searchLimitProperty = { type: 'integer', minimum: 1, maximum: 20 } as const;

/** Raw JSON Schema shapes for the four export-surface tool inputs. */
export const EXPORT_SURFACE_INPUT_SHAPES: Readonly<
  Record<ExportSurfaceToolName, Readonly<Record<string, unknown>>>
> = {
  find_export: objectSchema({ symbol: stringProperty, limit: searchLimitProperty }, ['symbol']),
  list_package_exports: objectSchema({
    package: stringProperty,
    offset: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 1, maximum: 49 },
  }, ['package']),
  get_export: objectSchema({
    symbol: stringProperty,
    package: stringProperty,
    subpath: stringProperty,
  }, ['symbol']),
  search_exports: objectSchema({
    query: stringProperty,
    package: stringProperty,
    kind: stringProperty,
    limit: searchLimitProperty,
  }, ['query']),
};

/** Raw JSON Schema shapes for the four export-surface tool outputs. */
export const EXPORT_SURFACE_OUTPUT_SHAPES: Readonly<
  Record<ExportSurfaceToolName, Readonly<Record<string, unknown>>>
> = {
  find_export: objectSchema({
    symbol: stringProperty,
    total: { type: 'integer' },
    matches: {
      type: 'array',
      maxItems: 20,
      items: objectSchema({
        package: stringProperty,
        subpath: stringProperty,
        kind: stringProperty,
      }, ['package', 'subpath', 'kind']),
    },
    truncated: { type: 'boolean' },
  }, ['symbol', 'total', 'matches', 'truncated']),
  list_package_exports: objectSchema({
    package: stringProperty,
    total: { type: 'integer' },
    returned: { type: 'integer' },
    offset: { type: 'integer' },
    nextOffset: { type: 'integer' },
    groups: {
      type: 'array',
      maxItems: 49,
      items: objectSchema({
        subpath: stringProperty,
        total: { type: 'integer' },
        symbols: {
          type: 'array',
          maxItems: 49,
          items: objectSchema({ name: stringProperty, kind: stringProperty }, ['name', 'kind']),
        },
      }, ['subpath', 'total', 'symbols']),
    },
    truncated: { type: 'boolean' },
  }, ['package', 'total', 'returned', 'offset', 'groups', 'truncated']),
  get_export: objectSchema({
    package: stringProperty,
    subpath: stringProperty,
    symbol: stringProperty,
    kind: stringProperty,
    signature: stringProperty,
    jsDoc: stringProperty,
    truncated: { type: 'boolean' },
  }, ['package', 'subpath', 'symbol', 'kind', 'signature', 'jsDoc', 'truncated']),
  search_exports: objectSchema({
    query: stringProperty,
    total: { type: 'integer' },
    matches: {
      type: 'array',
      maxItems: 20,
      items: objectSchema({
        package: stringProperty,
        subpath: stringProperty,
        symbol: stringProperty,
        kind: stringProperty,
        signature: stringProperty,
        score: { type: 'number' },
      }, ['package', 'subpath', 'symbol', 'kind', 'signature', 'score']),
    },
    truncated: { type: 'boolean' },
  }, ['query', 'total', 'matches', 'truncated']),
};
import type { ExportSurfaceToolName } from './export-surface-flows.ts';
