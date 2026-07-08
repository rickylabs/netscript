/**
 * Primitive attribute value preserved by telemetry query readers.
 */
export type TelemetryAttributeValue = string | number | boolean;

/**
 * Span kind names exposed by telemetry read models.
 */
export type TelemetrySpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

/**
 * Metric aggregation kinds exposed by telemetry read models.
 */
export type TelemetryMetricType = 'counter' | 'histogram' | 'gauge';

/**
 * A single span event as read back from a telemetry backend.
 */
export interface TelemetrySpanEvent {
  /** Event name. */
  readonly name: string;
  /** Event timestamp in Unix epoch milliseconds. */
  readonly timeUnixMs: number;
  /** Flattened event attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
}

/**
 * Link from a queried span to another span context.
 */
export interface TelemetrySpanLink {
  /** Linked trace identifier. */
  readonly traceId: string;
  /** Linked span identifier. */
  readonly spanId: string;
  /** Flattened link attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
}

/**
 * A single span as read back from a telemetry backend.
 */
export interface TelemetrySpan {
  /** Trace identifier the span belongs to. */
  readonly traceId: string;
  /** Span identifier. */
  readonly spanId: string;
  /** Parent span identifier, when the span is not a trace root. */
  readonly parentSpanId?: string;
  /** Span operation name. */
  readonly name: string;
  /** Span kind. */
  readonly kind: TelemetrySpanKind;
  /** Span start time in Unix epoch milliseconds. */
  readonly startTimeUnixMs: number;
  /** Span end time in Unix epoch milliseconds, when the span has ended. */
  readonly endTimeUnixMs?: number;
  /** Numeric status code (`0` unset, `1` ok, `2` error). */
  readonly statusCode: number;
  /** Optional status message reported by the backend. */
  readonly statusMessage?: string;
  /** Flattened span attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
  /** Span events emitted during the operation. */
  readonly events: readonly TelemetrySpanEvent[];
  /** Span links attached at creation time. */
  readonly links: readonly TelemetrySpanLink[];
}

/**
 * A full trace as read back from a telemetry backend.
 */
export interface TelemetryTrace {
  /** Trace identifier. */
  readonly traceId: string;
  /** Spans that make up the trace, sorted by start time. */
  readonly spans: readonly TelemetrySpan[];
}

/**
 * A single structured log record as read back from a telemetry backend.
 */
export interface TelemetryLog {
  /** Log timestamp in Unix epoch milliseconds. */
  readonly timeUnixMs: number;
  /** Severity text (for example `"INFO"` or `"ERROR"`). */
  readonly severity: string;
  /** Log body / message. */
  readonly body: string;
  /** Trace identifier the log is correlated with, when present. */
  readonly traceId?: string;
  /** Span identifier the log is correlated with, when present. */
  readonly spanId?: string;
  /** Flattened log attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
}

/**
 * A resource (service instance) that emitted telemetry.
 */
export interface TelemetryResource {
  /** Service name reported by the resource. */
  readonly serviceName: string;
  /** Service instance identifier, when reported. */
  readonly serviceInstanceId?: string;
  /** Flattened resource attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
}

/**
 * A single metric data point as read back from a telemetry backend.
 */
export interface TelemetryMetricPoint {
  /** Point timestamp in Unix epoch milliseconds. */
  readonly timeUnixMs: number;
  /** Numeric metric value. */
  readonly value: number;
  /** Flattened point attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, TelemetryAttributeValue>>;
}

/**
 * A metric stream as read back from a telemetry backend.
 */
export interface TelemetryMetric {
  /** Metric instrument name. */
  readonly name: string;
  /** Metric kind. */
  readonly type: TelemetryMetricType;
  /** Optional unit reported by the instrument. */
  readonly unit?: string;
  /** Optional description reported by the instrument. */
  readonly description?: string;
  /** Resource that emitted the metric, when present. */
  readonly resource?: TelemetryResource;
  /** Metric points in emission order. */
  readonly points: readonly TelemetryMetricPoint[];
}

/**
 * Filter for a trace query.
 */
export interface TraceQueryFilter {
  /** Restrict results to traces emitted by this Aspire resource or service name. */
  readonly resource?: string;
  /** Alias for {@linkcode TraceQueryFilter.resource}. */
  readonly serviceName?: string;
  /** Only include traces that started at or after this Unix epoch millisecond. */
  readonly sinceUnixMs?: number;
  /** Maximum number of traces to return. */
  readonly limit?: number;
  /** Follow live NDJSON streams when the backend supports it. */
  readonly follow?: boolean;
}

/**
 * Filter for a resource query.
 */
export interface ResourceQueryFilter {
  /** Restrict results to this Aspire resource or service name. */
  readonly resource?: string;
  /** Alias for {@linkcode ResourceQueryFilter.resource}. */
  readonly serviceName?: string;
}

/**
 * Filter for a metric query.
 */
export interface MetricQueryFilter {
  /** Restrict results to this Aspire resource or service name. */
  readonly resource?: string;
  /** Alias for {@linkcode MetricQueryFilter.resource}. */
  readonly serviceName?: string;
  /** Restrict results to this metric instrument name. */
  readonly metricName?: string;
  /** Only include points at or after this Unix epoch millisecond. */
  readonly sinceUnixMs?: number;
  /** Maximum number of metric streams to return. */
  readonly limit?: number;
  /** Follow live NDJSON streams when the backend supports it. */
  readonly follow?: boolean;
}

/**
 * Portable OTLP JSON payload exported from queried traces.
 */
export interface TelemetryOtlpJson {
  /** OTLP resourceSpans payload. */
  readonly resourceSpans: readonly unknown[];
}
