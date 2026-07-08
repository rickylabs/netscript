/**
 * Telemetry query read-model contract for {@linkcode @netscript/telemetry}.
 *
 * Backs the contract half of `@netscript/telemetry/query`. Concrete readers
 * live under adapters and implement {@linkcode TelemetryQueryPort}; this module
 * owns the typed read model, Standard Schema filters, and the package-owned
 * port surface without depending on any backend.
 *
 * @module
 */

export type {
  MetricQueryFilter,
  ResourceQueryFilter,
  TelemetryAttributeValue,
  TelemetryLog,
  TelemetryMetric,
  TelemetryMetricPoint,
  TelemetryMetricType,
  TelemetryOtlpJson,
  TelemetryResource,
  TelemetrySpan,
  TelemetrySpanEvent,
  TelemetrySpanKind,
  TelemetrySpanLink,
  TelemetryTrace,
  TraceQueryFilter,
} from './types.ts';
export type {
  TelemetryQueryOptions,
  TelemetryQueryPort,
} from '../../ports/telemetry-query-port.ts';
export {
  metricQueryFilterSchema,
  resourceQueryFilterSchema,
  TelemetryQueryValidationError,
  traceQueryFilterSchema,
  validateMetricQueryFilter,
  validateResourceQueryFilter,
  validateTraceQueryFilter,
} from './schema.ts';
