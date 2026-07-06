/**
 * Read-model contracts for querying emitted telemetry.
 *
 * These types describe the shape of telemetry data as read back from a
 * telemetry backend (for example the Aspire dashboard's structured store),
 * distinct from the write-side span contracts in `domain/types.ts`. They back
 * the `@netscript/telemetry/query` subpath.
 *
 * @module
 */

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
  /** Span start time in Unix epoch milliseconds. */
  readonly startTimeUnixMs: number;
  /** Span end time in Unix epoch milliseconds, when the span has ended. */
  readonly endTimeUnixMs?: number;
  /** Numeric status code (`0` unset, `1` ok, `2` error). */
  readonly statusCode: number;
  /** Flattened span attributes keyed by attribute name. */
  readonly attributes: Readonly<Record<string, string>>;
}

/**
 * A full trace as read back from a telemetry backend.
 */
export interface TelemetryTrace {
  /** Trace identifier. */
  readonly traceId: string;
  /** Spans that make up the trace, in emission order. */
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
  readonly attributes: Readonly<Record<string, string>>;
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
  readonly attributes: Readonly<Record<string, string>>;
}

/**
 * Filter for a trace query.
 */
export interface TraceQueryFilter {
  /** Restrict results to traces emitted by this service name. */
  readonly serviceName?: string;
  /** Only include traces that started at or after this Unix epoch millisecond. */
  readonly sinceUnixMs?: number;
  /** Maximum number of traces to return. */
  readonly limit?: number;
}

/**
 * Filter for a resource query.
 */
export interface ResourceQueryFilter {
  /** Restrict results to this service name. */
  readonly serviceName?: string;
}
