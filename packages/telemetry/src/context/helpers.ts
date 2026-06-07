import { context, type Span as OtelSpan, trace } from '@opentelemetry/api';
import type { Context, Span } from '../core/mod.ts';

function assertOtelSpan(span: Span): asserts span is Span & OtelSpan {
  if (span === null || typeof span !== 'object') {
    throw new TypeError(
      'Expected an OpenTelemetry-compatible span object before adding it to context',
    );
  }

  for (
    const method of [
      'spanContext',
      'setAttribute',
      'setAttributes',
      'addEvent',
      'addLink',
      'addLinks',
      'setStatus',
      'updateName',
      'isRecording',
      'recordException',
      'end',
    ] as const
  ) {
    if (typeof span[method] !== 'function') {
      throw new TypeError(
        `Expected an OpenTelemetry-compatible span before adding it to context; missing required method '${method}'`,
      );
    }
  }
}

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
  assertOtelSpan(span);
  return trace.setSpan(parentContext ?? context.active(), span);
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
