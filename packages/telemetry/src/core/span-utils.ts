import { type Attributes, type Span, SpanStatusCode } from '@opentelemetry/api';

export function setSpanAttributes(span: Span, attributes: Attributes): void {
  span.setAttributes(attributes);
}

export function setSpanOk(span: Span): void {
  span.setStatus({ code: SpanStatusCode.OK });
}

export function setSpanError(span: Span, message: string, error?: Error): void {
  span.setStatus({ code: SpanStatusCode.ERROR, message });
  if (error) {
    span.recordException(error);
  }
}

export function addSpanEvent(span: Span, name: string, attributes?: Attributes): void {
  span.addEvent(name, attributes);
}
