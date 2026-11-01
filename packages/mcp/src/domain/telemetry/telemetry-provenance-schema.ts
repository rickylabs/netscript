import type { JsonSchema } from '../schema.ts';

const nullableCount: JsonSchema = { type: ['integer', 'null'], minimum: 0 };
const windowSchema: JsonSchema = {
  type: 'object',
  properties: { sinceUnixMs: { type: 'number' }, untilUnixMs: { type: 'number' } },
  required: ['sinceUnixMs', 'untilUnixMs'],
  additionalProperties: false,
};

/** Public tool evidence contract shared by the three status/performance tools. */
export const TELEMETRY_PROVENANCE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    state: { enum: ['ready', 'no_data', 'partial', 'unbound', 'unavailable'] },
    window: windowSchema,
    sampleCount: nullableCount,
    logCount: nullableCount,
    servingRevision: { type: 'string', minLength: 1, maxLength: 120 },
    serviceRevisions: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 120 } },
    source: { enum: ['aspire_dashboard', 'injected_query'] },
    nativeMetrics: { enum: ['dashboard_only'] },
    sourceTruncated: { type: ['boolean', 'null'] },
    observedRange: { type: ['object', 'null'] },
    totalCount: nullableCount,
    returnedCount: nullableCount,
    limit: { type: 'integer', minimum: 1 },
  },
  required: [
    'state',
    'window',
    'sampleCount',
    'logCount',
    'servingRevision',
    'serviceRevisions',
    'source',
    'nativeMetrics',
    'sourceTruncated',
    'observedRange',
    'totalCount',
    'returnedCount',
    'limit',
  ],
  additionalProperties: false,
};
