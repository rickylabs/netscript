import type { JsonSchema } from '../schema.ts';
import { TELEMETRY_PROVENANCE_SCHEMA } from './telemetry-provenance-schema.ts';
const stringProperty = { type: 'string' } as const;

/** Analysis schemas colocate sampling evidence with the measured summary contract. */
export const TELEMETRY_ANALYSIS_OUTPUT_SHAPES: Readonly<
  Record<'analyze_service_performance' | 'analyze_db_bottlenecks', JsonSchema>
> = {
  analyze_service_performance: {
    type: 'object',
    properties: {
      provenance: TELEMETRY_PROVENANCE_SCHEMA,
      service: stringProperty,
      sinceUnixMs: { type: 'number' },
      sampleCount: { type: 'integer' },
      errorCount: { type: 'integer' },
      errorRate: { type: 'number' },
      averageDurationMs: { type: 'number' },
      p50DurationMs: { type: 'number' },
      p95DurationMs: { type: 'number' },
      throughputPerMinute: { type: 'number' },
      topOperations: { type: 'array', maxItems: 20 },
    },
    required: [
      'provenance',
      'service',
      'sinceUnixMs',
      'sampleCount',
      'errorCount',
      'errorRate',
      'averageDurationMs',
      'p50DurationMs',
      'p95DurationMs',
      'throughputPerMinute',
      'topOperations',
    ],
    additionalProperties: false,
  },
  analyze_db_bottlenecks: {
    type: 'object',
    properties: {
      provenance: TELEMETRY_PROVENANCE_SCHEMA,
      sinceUnixMs: { type: 'number' },
      sampleCount: { type: 'integer' },
      operations: { type: 'array', maxItems: 20 },
    },
    required: ['provenance', 'sinceUnixMs', 'sampleCount', 'operations'],
    additionalProperties: false,
  },
};
