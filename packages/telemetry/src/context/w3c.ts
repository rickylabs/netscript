import {
  context,
  propagation,
  type TextMapGetter,
  type TextMapSetter,
  trace,
} from '@opentelemetry/api';
import type { Context, Span, SpanContext } from '../core/mod.ts';
import type { ParsedTraceparent, PropagationHeaders, SerializedTraceContext } from './types.ts';

const TRACEPARENT_HEADER = 'traceparent';
const TRACESTATE_HEADER = 'tracestate';
const TRACE_CONTEXT_VERSION = '00';
const INVALID_TRACE_ID = '00000000000000000000000000000000';
const INVALID_SPAN_ID = '0000000000000000';

const headersGetter: TextMapGetter<PropagationHeaders> = {
  keys(carrier: PropagationHeaders) {
    return Object.keys(carrier);
  },
  get(carrier: PropagationHeaders, key: string) {
    return carrier[key.toLowerCase()];
  },
};

const headersSetter: TextMapSetter<PropagationHeaders> = {
  set(carrier: PropagationHeaders, key: string, value: string) {
    carrier[key.toLowerCase()] = value;
  },
};

function isValidSpanContext(spanContext: SpanContext): boolean {
  return spanContext.traceId !== INVALID_TRACE_ID && spanContext.spanId !== INVALID_SPAN_ID;
}

/**
 * Format a span context as a W3C traceparent header.
 */
export function formatTraceparent(spanContext: SpanContext): string {
  const flags = spanContext.traceFlags.toString(16).padStart(2, '0');
  return `${TRACE_CONTEXT_VERSION}-${spanContext.traceId}-${spanContext.spanId}-${flags}`;
}

/**
 * Parse a W3C traceparent header into its component identifiers.
 */
export function parseTraceparent(traceparent: string): ParsedTraceparent | null {
  const parts = traceparent.split('-');
  if (parts.length !== 4) {
    return null;
  }

  const version = parts[0]!;
  const traceId = parts[1]!;
  const parentId = parts[2]!;
  const flags = parts[3]!;
  if (
    version.length !== 2 || traceId.length !== 32 || parentId.length !== 16 || flags.length !== 2
  ) {
    return null;
  }

  return {
    version,
    traceId,
    parentId,
    traceFlags: Number.parseInt(flags, 16),
  };
}

/**
 * Inject a telemetry context into a mutable propagation header bag.
 */
export function injectContext(
  headers: PropagationHeaders = {},
  ctx?: Context,
): PropagationHeaders {
  const activeContext = ctx ?? context.active();
  propagation.inject(activeContext, headers, headersSetter);

  if (!headers[TRACEPARENT_HEADER]) {
    const span = trace.getSpan(activeContext);
    if (span) {
      const spanContext = span.spanContext();
      if (isValidSpanContext(spanContext)) {
        headers[TRACEPARENT_HEADER] = formatTraceparent(spanContext);
      }
    }
  }

  return headers;
}

/**
 * Resolve serialized trace context headers for a context.
 */
export function resolveTraceContext(ctx?: Context): SerializedTraceContext | null {
  const headers = injectContext({}, ctx);
  const traceparent = headers[TRACEPARENT_HEADER];
  if (!traceparent) {
    return null;
  }

  return {
    traceparent,
    tracestate: headers[TRACESTATE_HEADER],
  };
}

/**
 * Resolve serialized trace context headers from a span.
 */
export function resolveTraceContextFromSpan(span: Span): SerializedTraceContext {
  return { traceparent: formatTraceparent(span.spanContext()) };
}

/**
 * Extract a telemetry context from propagation headers.
 */
export function extractContext(headers: PropagationHeaders): Context {
  const extractedContext = propagation.extract(context.active(), headers, headersGetter);
  const extractedSpan = trace.getSpan(extractedContext);
  if (extractedSpan && extractedSpan.spanContext().traceId !== INVALID_TRACE_ID) {
    return extractedContext;
  }

  let traceparent = headers[TRACEPARENT_HEADER] ?? headers['traceparent'];
  if (traceparent?.includes(',')) {
    traceparent = (traceparent.split(',')[0] ?? '').trim();
  }

  if (!traceparent) {
    return context.active();
  }

  const parsed = parseTraceparent(traceparent);
  if (!parsed) {
    return context.active();
  }

  const remoteSpanContext: SpanContext = {
    traceId: parsed.traceId,
    spanId: parsed.parentId,
    traceFlags: parsed.traceFlags,
    isRemote: true,
  };

  return trace.setSpan(context.active(), trace.wrapSpanContext(remoteSpanContext));
}

/**
 * Extract a telemetry context from serialized trace context headers.
 */
export function extractFromTraceContext(traceContext: SerializedTraceContext): Context {
  const headers: PropagationHeaders = {
    [TRACEPARENT_HEADER]: traceContext.traceparent,
  };
  if (traceContext.tracestate) {
    headers[TRACESTATE_HEADER] = traceContext.tracestate;
  }
  return extractContext(headers);
}
