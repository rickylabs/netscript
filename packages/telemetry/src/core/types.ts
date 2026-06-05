/**
 * Core OpenTelemetry types re-exported for package consumers.
 */

export type {
  Attributes,
  AttributeValue,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
} from '@opentelemetry/api';
export { SpanKind, SpanStatusCode } from '@opentelemetry/api';

import type { Attributes, Context, Link, Span } from '@opentelemetry/api';
import type { SpanKind } from '@opentelemetry/api';

/**
 * Options for creating a span.
 */
export interface CreateSpanOptions {
  kind?: SpanKind;
  attributes?: Attributes;
  parentContext?: Context;
  links?: Link[];
}

/**
 * Result of a traced operation.
 */
export interface TracedResult<T> {
  value: T;
  span: Span;
}
