import type {
  MetricQueryFilter,
  ResourceQueryFilter,
  TelemetryLog,
  TelemetryMetric,
  TelemetryOtlpJson,
  TelemetryResource,
  TelemetrySpan,
  TelemetryTrace,
  TraceQueryFilter,
} from '../domain/query.ts';

/**
 * Read-side telemetry query port consumed by NetScript dashboards and diagnostics.
 */
export interface TelemetryQueryPort {
  /**
   * Return traces matching the supplied filter.
   *
   * @param filter Optional trace-query filter.
   * @returns Matching traces grouped by trace identifier.
   */
  queryTraces(filter?: TraceQueryFilter): Promise<readonly TelemetryTrace[]>;

  /**
   * Return a single trace by identifier, or `undefined` when absent.
   *
   * @param traceId Trace identifier to look up.
   * @returns The matching trace, or `undefined`.
   */
  getTrace(traceId: string): Promise<TelemetryTrace | undefined>;

  /**
   * Return spans matching the supplied filter.
   *
   * @param filter Optional trace-query filter.
   * @returns Matching spans in backend order.
   */
  querySpans(filter?: TraceQueryFilter): Promise<readonly TelemetrySpan[]>;

  /**
   * Return structured logs matching the supplied filter.
   *
   * @param filter Optional trace-query filter.
   * @returns Matching logs in backend order.
   */
  queryLogs(filter?: TraceQueryFilter): Promise<readonly TelemetryLog[]>;

  /**
   * Return metric streams matching the supplied filter.
   *
   * @param filter Optional metric-query filter.
   * @returns Matching metric streams.
   */
  queryMetrics(filter?: MetricQueryFilter): Promise<readonly TelemetryMetric[]>;

  /**
   * Return resources matching the supplied filter.
   *
   * @param filter Optional resource-query filter.
   * @returns Matching resources.
   */
  queryResources(filter?: ResourceQueryFilter): Promise<readonly TelemetryResource[]>;

  /**
   * Export matching traces as portable OTLP JSON.
   *
   * @param filter Optional trace-query filter.
   * @returns OTLP JSON suitable for archival or fixture use.
   */
  exportTraces(filter?: TraceQueryFilter): Promise<TelemetryOtlpJson>;
}

/**
 * Options shared by telemetry query adapter factories.
 */
export interface TelemetryQueryOptions {
  /** Base URL of the telemetry backend's query API. */
  readonly endpoint?: string;
  /** API key supplied to Aspire dashboard telemetry endpoints. */
  readonly apiKey?: string;
  /** Fetch implementation used by the adapter. */
  readonly fetch?: typeof fetch;
  /** Abort signal applied to backend requests. */
  readonly signal?: AbortSignal;
}
