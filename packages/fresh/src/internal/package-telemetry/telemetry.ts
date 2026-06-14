import {
  type Attributes,
  getTracer,
  type Span,
  SpanKind,
  type Tracer,
  withSpan,
} from '@netscript/telemetry/tracer';

/** Attribute bag accepted by Fresh telemetry helpers. */
export type FreshSpanAttributeMap = Attributes;

/** Options used to start a Fresh telemetry span. */
export interface FreshSpanOptions {
  /** Fresh sub-scope used to create a scoped tracer. */
  scope: string;
  /** Span name in `<domain>.<operation>` form. */
  name: string;
  /** Logical NetScript operation attached to the span. */
  operation?: string;
  /** OpenTelemetry span kind. */
  kind?: SpanKind;
  /** Initial span attributes. */
  attributes?: FreshSpanAttributeMap;
}

/** Attributes attached when Fresh records an error on a span. */
export type FreshErrorAttributes = FreshSpanAttributeMap & {
  /** Error class or symbolic error category. */
  'error.type'?: string;
  /** Human-readable error message. */
  'error.message'?: string;
  /** HTTP status code associated with the error. */
  'http.response.status_code'?: number;
  /** Logical NetScript operation associated with the error. */
  'netscript.operation'?: string;
};

/** Create a scoped tracer for a Fresh support-spine domain. */
export function createFreshTracer(scope: string): Tracer {
  return getTracer(`@netscript/fresh/${scope}`);
}

/** Execute work inside a Fresh span with normalized NetScript operation attributes. */
export function withFreshSpan<T>(
  options: FreshSpanOptions,
  run: (span: Span) => Promise<T> | T,
): Promise<T> {
  const attributes: FreshSpanAttributeMap = {
    ...(options.attributes ?? {}),
    ...(options.operation ? { 'netscript.operation': options.operation } : {}),
  };

  return withSpan(
    createFreshTracer(options.scope),
    options.name,
    run,
    {
      kind: options.kind ?? SpanKind.INTERNAL,
      attributes,
    },
  );
}

/** Record a normalized exception on an active Fresh span. */
export function emitFreshError(
  span: Span,
  error: unknown,
  attributes: FreshErrorAttributes = {},
): void {
  const exception = error instanceof Error ? error : new Error(String(error));
  const errorType = exception.name || 'Error';
  const errorMessage = exception.message;

  span.recordException(exception);
  span.setAttributes({
    'error.type': errorType,
    'error.message': errorMessage,
    ...attributes,
  });
  span.addEvent('error', {
    'error.type': errorType,
    'error.message': errorMessage,
    ...attributes,
  });
}
