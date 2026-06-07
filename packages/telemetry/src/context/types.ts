/**
 * Serialized W3C trace context headers.
 */
export interface SerializedTraceContext {
  /** W3C traceparent header value. */
  traceparent: string;
  /** Optional W3C tracestate header value. */
  tracestate?: string;
}

/**
 * Mutable propagation header bag.
 */
export type PropagationHeaders = Record<string, string>;

/**
 * Environment variables used to pass trace context to job subprocesses.
 */
export interface JobTraceEnv {
  /** JSON serialized trace context used by NetScript jobs. */
  JOB_TRACE_CONTEXT?: string;
  /** W3C traceparent header value. */
  TRACEPARENT?: string;
  /** Optional W3C tracestate header value. */
  TRACESTATE?: string;
}

/**
 * Parsed components from a W3C traceparent header.
 */
export interface ParsedTraceparent {
  /** Trace Context version. */
  version: string;
  /** Trace identifier. */
  traceId: string;
  /** Parent span identifier. */
  parentId: string;
  /** Trace flags as a numeric value. */
  traceFlags: number;
}
