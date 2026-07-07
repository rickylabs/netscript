import {
  context,
  propagation,
  type TextMapGetter,
  type TextMapSetter,
  trace,
} from '@opentelemetry/api';
import type { Context, Span, SpanContext, TraceState } from '../application/mod.ts';
import type { ParsedTraceparent, PropagationHeaders, SerializedTraceContext } from './types.ts';

const TRACEPARENT_HEADER = 'traceparent';
const TRACESTATE_HEADER = 'tracestate';
const TRACE_CONTEXT_VERSION = '00';
/** W3C reserves version `ff`; a traceparent carrying it is invalid. */
const INVALID_VERSION = 'ff';
const INVALID_TRACE_ID = '00000000000000000000000000000000';
const INVALID_SPAN_ID = '0000000000000000';
const HEX_VERSION = /^[0-9a-f]{2}$/;
const HEX_TRACE_ID = /^[0-9a-f]{32}$/;
const HEX_SPAN_ID = /^[0-9a-f]{16}$/;
const HEX_FLAGS = /^[0-9a-f]{2}$/;
/** W3C `tracestate` allows at most 32 list members. */
const TRACESTATE_MAX_MEMBERS = 32;

/**
 * Minimal immutable {@link TraceState} implementation used to preserve
 * `tracestate` across the manual traceparent fallback in {@link extractContext}.
 *
 * A registered W3C propagator handles `tracestate` when a provider is active;
 * this parser backs the fallback path so `tracestate` is never silently dropped
 * when the propagator yields no remote span.
 */
class ParsedTraceState implements TraceState {
  readonly #entries: ReadonlyArray<readonly [string, string]>;

  constructor(entries: ReadonlyArray<readonly [string, string]>) {
    this.#entries = entries;
  }

  get(key: string): string | undefined {
    return this.#entries.find(([entryKey]) => entryKey === key)?.[1];
  }

  set(key: string, value: string): TraceState {
    // W3C: an updated/added key moves to the front of the list.
    const rest = this.#entries.filter(([entryKey]) => entryKey !== key);
    const head: readonly [string, string] = [key, value];
    return new ParsedTraceState([head, ...rest].slice(0, TRACESTATE_MAX_MEMBERS));
  }

  unset(key: string): TraceState {
    return new ParsedTraceState(this.#entries.filter(([entryKey]) => entryKey !== key));
  }

  serialize(): string {
    return this.#entries.map(([key, value]) => `${key}=${value}`).join(',');
  }
}

/**
 * Parse a W3C `tracestate` header into a {@link TraceState}.
 *
 * Malformed members are dropped and the list is truncated to the W3C limit of
 * 32 members. Returns `undefined` when the header is absent or carries no valid
 * members so an empty trace-state is never attached to a span context.
 */
export function parseTraceState(header: string | undefined): TraceState | undefined {
  if (!header) {
    return undefined;
  }
  const entries: Array<readonly [string, string]> = [];
  for (const rawMember of header.split(',')) {
    const member = rawMember.trim();
    if (member.length === 0) {
      continue;
    }
    const separator = member.indexOf('=');
    if (separator <= 0 || separator === member.length - 1) {
      continue;
    }
    entries.push([member.slice(0, separator), member.slice(separator + 1)]);
    if (entries.length >= TRACESTATE_MAX_MEMBERS) {
      break;
    }
  }
  return entries.length === 0 ? undefined : new ParsedTraceState(entries);
}

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
  // Validate every field as W3C-shaped lowercase hex of the exact width, and
  // reject the reserved `ff` version and the all-zero (invalid) identifiers so
  // the fallback in `extractContext` cannot build a bogus remote span context.
  if (
    !HEX_VERSION.test(version) || version === INVALID_VERSION ||
    !HEX_TRACE_ID.test(traceId) || traceId === INVALID_TRACE_ID ||
    !HEX_SPAN_ID.test(parentId) || parentId === INVALID_SPAN_ID ||
    !HEX_FLAGS.test(flags)
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

  // Preserve `tracestate` when reconstructing the remote span context. The
  // propagator handles this when a provider is registered; without one the
  // fallback previously dropped `tracestate`, severing vendor trace continuation.
  const traceState = parseTraceState(headers[TRACESTATE_HEADER] ?? headers['tracestate']);
  const remoteSpanContext: SpanContext = {
    traceId: parsed.traceId,
    spanId: parsed.parentId,
    traceFlags: parsed.traceFlags,
    isRemote: true,
    ...(traceState ? { traceState } : {}),
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
