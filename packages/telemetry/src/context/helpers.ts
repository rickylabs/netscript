import { context, type Span as OtelSpan, trace } from '@opentelemetry/api';
import type { Context, Span } from '../core/mod.ts';

/**
 * Run a synchronous function inside the supplied telemetry context.
 */
export function withContext<T>(ctx: Context, fn: () => T): T {
  return context.with(ctx, fn);
}

/**
 * Run an asynchronous function inside the supplied telemetry context.
 */
export async function withContextAsync<T>(ctx: Context, fn: () => Promise<T>): Promise<T> {
  return await context.with(ctx, fn);
}

/**
 * Return a context containing the supplied span.
 */
export function contextWithSpan(span: Span, parentContext?: Context): Context {
  return trace.setSpan(parentContext ?? context.active(), span as OtelSpan);
}

/**
 * Return the span stored in a telemetry context, when present.
 */
export function getSpanFromContext(ctx: Context): Span | undefined {
  return trace.getSpan(ctx) as Span | undefined;
}

/**
 * Report whether a context contains an active span.
 */
export function hasActiveSpan(ctx?: Context): boolean {
  return trace.getSpan(ctx ?? context.active()) !== undefined;
}

/**
 * Return the trace identifier for a context's active span.
 */
export function getTraceId(ctx?: Context): string | undefined {
  return trace.getSpan(ctx ?? context.active())?.spanContext().traceId;
}

/**
 * Return the span identifier for a context's active span.
 */
export function getSpanId(ctx?: Context): string | undefined {
  return trace.getSpan(ctx ?? context.active())?.spanContext().spanId;
}
