import { type Attributes, type Span, SpanStatusCode } from '../domain/types.ts';

/**
 * Set several attributes on a span.
 */
export function setSpanAttributes(span: Span, attributes: Attributes): void {
  span.setAttributes(attributes);
}

/**
 * Mark a span as successful.
 */
export function setSpanOk(span: Span): void {
  span.setStatus({ code: SpanStatusCode.OK });
}

/**
 * Mark a span as failed and optionally record the thrown error.
 */
export function setSpanError(span: Span, message: string, error?: Error): void {
  span.setStatus({ code: SpanStatusCode.ERROR, message });
  if (error) {
    span.recordException(error);
  }
}

/**
 * Add a named event to a span.
 */
export function addSpanEvent(span: Span, name: string, attributes?: Attributes): void {
  span.addEvent(name, attributes);
}
