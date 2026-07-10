/**
 * Telemetry query contracts and Aspire-backed reader.
 *
 * The contract types and Standard Schema filters come from the application
 * query layer; the default factory wires the reference Aspire dashboard
 * adapter without adding any dashboard UI dependency.
 *
 * @module
 */

export {
  metricQueryFilterSchema,
  resourceQueryFilterSchema,
  TelemetryQueryValidationError,
  traceQueryFilterSchema,
  validateMetricQueryFilter,
  validateResourceQueryFilter,
  validateTraceQueryFilter,
} from './src/application/query/mod.ts';
export type {
  MetricQueryFilter,
  ResourceQueryFilter,
  TelemetryAttributeValue,
  TelemetryLog,
  TelemetryMetric,
  TelemetryMetricPoint,
  TelemetryMetricType,
  TelemetryOtlpJson,
  TelemetryQueryOptions,
  TelemetryQueryPort,
  TelemetryResource,
  TelemetrySpan,
  TelemetrySpanEvent,
  TelemetrySpanKind,
  TelemetrySpanLink,
  TelemetryTrace,
  TraceQueryFilter,
} from './src/application/query/mod.ts';
export {
  AspireTelemetryQuery,
  createAspireTelemetryQuery,
} from './src/adapters/aspire-query/mod.ts';
export type { AspireTelemetryQueryOptions } from './src/adapters/aspire-query/mod.ts';
import { createAspireTelemetryQuery } from './src/adapters/aspire-query/mod.ts';
import type { AspireTelemetryQueryOptions } from './src/adapters/aspire-query/mod.ts';
import type { TelemetryQueryPort } from './src/application/query/mod.ts';

/**
 * Create the default telemetry query reader.
 *
 * @param options Aspire dashboard endpoint, optional API key, fetch override, and signal.
 * @returns A telemetry query port backed by Aspire dashboard telemetry endpoints.
 */
export function createTelemetryQuery(
  options: AspireTelemetryQueryOptions = {},
): TelemetryQueryPort {
  return createAspireTelemetryQuery(options);
}
