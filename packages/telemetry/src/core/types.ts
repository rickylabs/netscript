/**
 * Core telemetry contracts exposed by `@netscript/telemetry`.
 */

/**
 * Primitive value accepted by OpenTelemetry span attributes.
 */
export type AttributeValue =
  | string
  | number
  | boolean
  | Array<string | null | undefined>
  | Array<number | null | undefined>
  | Array<boolean | null | undefined>;

/**
 * Attribute bag attached to spans and events.
 */
export type Attributes = Record<string, AttributeValue | undefined>;

/**
 * Exception-like value that can be recorded on a span.
 */
export type Exception =
  | Error
  | string
  | {
    readonly name?: string;
    readonly message?: string;
    readonly code?: string;
    readonly stack?: string;
  };

/**
 * Timestamp input accepted by span APIs.
 */
export type TimeInput = number | Date | [number, number];

/**
 * W3C trace-state contract carried by span contexts.
 */
export interface TraceState {
  /** Return the value associated with a trace-state key. */
  get(key: string): string | undefined;
  /** Return a trace-state with the key removed. */
  unset(key: string): TraceState;
  /** Return a trace-state with the key set to the supplied value. */
  set(key: string, value: string): TraceState;
  /** Serialize the trace-state header value. */
  serialize(): string;
}

/**
 * Span context identifiers used for propagation.
 */
export interface SpanContext {
  /** Trace identifier for the distributed trace. */
  traceId: string;
  /** Span identifier for the current span. */
  spanId: string;
  /** Trace flags as defined by W3C Trace Context. */
  traceFlags: number;
  /** Whether the context came from a remote process. */
  isRemote?: boolean;
  /** Optional W3C trace-state values. */
  traceState?: TraceState;
}

/**
 * Execution context used by OpenTelemetry propagation helpers.
 */
export interface Context {
  /** Read a value from the context. */
  getValue(key: symbol): unknown;
  /** Return a context with the value set. */
  setValue(key: symbol, value: unknown): Context;
  /** Return a context with the value removed. */
  deleteValue(key: symbol): Context;
}

/**
 * Link from one span to another span context.
 */
export interface Link {
  /** Target span context. */
  context: SpanContext;
  /** Optional attributes for the link. */
  attributes?: Attributes;
  /** Number of dropped link attributes. */
  droppedAttributesCount?: number;
}

/**
 * Span status value.
 */
export interface SpanStatus {
  /** Status code for the span. */
  code: SpanStatusCode;
  /** Optional status message. */
  message?: string;
}

/**
 * Supported span kinds.
 */
export const SpanKind = {
  /** Default internal operation. */
  INTERNAL: 0,
  /** Server-side request handling. */
  SERVER: 1,
  /** Client-side request handling. */
  CLIENT: 2,
  /** Message producer operation. */
  PRODUCER: 3,
  /** Message consumer operation. */
  CONSUMER: 4,
} as const;

/**
 * Span kind value.
 */
export type SpanKind = (typeof SpanKind)[keyof typeof SpanKind];

/**
 * Supported span status codes.
 */
export const SpanStatusCode = {
  /** Operation status is unset. */
  UNSET: 0,
  /** Operation completed successfully. */
  OK: 1,
  /** Operation completed with an error. */
  ERROR: 2,
} as const;

/**
 * Span status code value.
 */
export type SpanStatusCode = (typeof SpanStatusCode)[keyof typeof SpanStatusCode];

/**
 * Options for starting a span.
 */
export interface SpanOptions {
  /** Span kind. */
  kind?: SpanKind;
  /** Initial span attributes. */
  attributes?: Attributes;
  /** Links to related spans. */
  links?: Link[];
  /** Explicit span start timestamp. */
  startTime?: TimeInput;
  /** Whether the span should ignore the parent context and start a root trace. */
  root?: boolean;
}

/**
 * OpenTelemetry-compatible span contract used by NetScript helpers.
 */
export interface Span {
  /** Return the immutable context identifiers for this span. */
  spanContext(): SpanContext;
  /** Set a single span attribute. */
  setAttribute(key: string, value: AttributeValue): this;
  /** Set several span attributes. */
  setAttributes(attributes: Attributes): this;
  /** Add an event to the span. */
  addEvent(
    name: string,
    attributesOrStartTime?: Attributes | TimeInput,
    startTime?: TimeInput,
  ): this;
  /** Add a link to another span context. */
  addLink(link: Link): this;
  /** Add several links to other span contexts. */
  addLinks(links: Link[]): this;
  /** Set span status. */
  setStatus(status: SpanStatus): this;
  /** Update the span name. */
  updateName(name: string): this;
  /** Report whether the span is recording telemetry data. */
  isRecording(): boolean;
  /** Record an exception on the span. */
  recordException(exception: Exception, time?: TimeInput): void;
  /** End the span. */
  end(endTime?: TimeInput): void;
}

/**
 * OpenTelemetry-compatible tracer contract used by NetScript helpers.
 */
export interface Tracer {
  /** Start a span with optional parent context. */
  startSpan(name: string, options?: SpanOptions, context?: Context): Span;
  /** Start an active span for the duration of a callback. */
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  /** Start an active span with explicit options for the duration of a callback. */
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  /** Start an active span with explicit options and parent context for a callback. */
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: (span: Span) => T,
  ): T;
}

/**
 * Options for creating a span.
 */
export interface CreateSpanOptions {
  /** Span kind. */
  kind?: SpanKind;
  /** Initial span attributes. */
  attributes?: Attributes;
  /** Parent context for the span. */
  parentContext?: Context;
  /** Links to related spans. */
  links?: Link[];
}

/**
 * Result of a traced operation.
 */
export interface TracedResult<T> {
  /** Operation result value. */
  value: T;
  /** Span created for the operation. */
  span: Span;
}
