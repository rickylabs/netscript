import {
  context,
  type Span,
  SpanKind,
  type SpanOptions,
  SpanStatusCode,
  trace,
  type Tracer,
} from '@opentelemetry/api';
import type { CreateSpanOptions } from './types.ts';

export function createSpan(
  tracer: Tracer,
  name: string,
  options: CreateSpanOptions = {},
): Span {
  const spanOptions: SpanOptions = {
    kind: options.kind ?? SpanKind.INTERNAL,
    attributes: options.attributes,
    links: options.links,
  };

  const parentContext = options.parentContext ?? context.active();
  return tracer.startSpan(name, spanOptions, parentContext);
}

export async function withSpan<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options: CreateSpanOptions = {},
): Promise<T> {
  const parentContext = options.parentContext ?? context.active();
  const span = tracer.startSpan(name, {
    kind: options.kind ?? SpanKind.INTERNAL,
    attributes: options.attributes,
    links: options.links,
  }, parentContext);

  try {
    const result = await context.with(
      trace.setSpan(parentContext, span),
      async () => await fn(span),
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message });
    if (error instanceof Error) {
      span.recordException(error);
    }
    throw error;
  } finally {
    span.end();
  }
}

export function withSpanSync<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => T,
  options: CreateSpanOptions = {},
): T {
  const parentContext = options.parentContext ?? context.active();
  const span = tracer.startSpan(name, {
    kind: options.kind ?? SpanKind.INTERNAL,
    attributes: options.attributes,
    links: options.links,
  }, parentContext);

  try {
    const result = context.with(trace.setSpan(parentContext, span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message });
    if (error instanceof Error) {
      span.recordException(error);
    }
    throw error;
  } finally {
    span.end();
  }
}
