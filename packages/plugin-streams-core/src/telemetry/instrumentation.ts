import { createFanInLinks, getTracer, SpanKind, SpanStatusCode } from '@netscript/telemetry';
import { formatTraceparent } from '@netscript/telemetry/context';
import { createOtelSdkSpanLink } from '@netscript/telemetry/otel';
import {
  StreamAttributes,
  StreamSpanNames,
  type StreamsTelemetryAttributes,
} from './attributes.ts';
import { CORE_PACKAGE_VERSION } from '../package-metadata.generated.ts';

/** Message consumed by stream subscribe instrumentation. */
export type StreamFanInMessage = Readonly<{
  traceparent?: string;
  tracestate?: string;
  streamPath?: string;
  collection?: string;
  operation?: string;
  messageId?: string;
  correlationId?: string;
}>;

/** Attribute value supported by the streams telemetry ports. */
export type StreamsSpanAttributeValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[];

/** W3C trace-state surface retained by a streams span context. */
export interface StreamsTraceState {
  /** Read a trace-state member. */
  get(key: string): string | undefined;
  /** Return a copy without a trace-state member. */
  unset(key: string): StreamsTraceState;
  /** Return a copy with a trace-state member. */
  set(key: string, value: string): StreamsTraceState;
  /** Serialize the W3C trace-state header. */
  serialize(): string;
}

/** W3C identifiers exposed by a streams instrumentation span. */
export interface StreamsSpanContext {
  /** W3C trace identifier. */
  readonly traceId: string;
  /** W3C span identifier. */
  readonly spanId: string;
  /** W3C trace flags byte. */
  readonly traceFlags: number;
  /** Whether the context originated outside this process. */
  readonly isRemote?: boolean;
  /** Optional W3C vendor trace state. */
  readonly traceState?: StreamsTraceState;
}

/** Span link accepted by the streams tracer port. */
export interface StreamsSpanLink {
  /** Context linked to the new span. */
  readonly context: StreamsSpanContext;
  /** Optional link attributes. */
  readonly attributes?: Readonly<Record<string, StreamsSpanAttributeValue | undefined>>;
  /** Number of attributes omitted by the provider. */
  readonly droppedAttributesCount?: number;
}

/** Minimal span lifecycle used by stream instrumentation. */
export interface StreamsSpanPort {
  /** Read the span's W3C identifiers. */
  spanContext(): StreamsSpanContext;
  /** Set one telemetry attribute. */
  setAttribute(key: string, value: StreamsSpanAttributeValue): this;
  /** Set the OpenTelemetry status code and optional message. */
  setStatus(status: Readonly<{ code: 0 | 1 | 2; message?: string }>): this;
  /** Record an exception on the span. */
  recordException(exception: Error): void;
  /** End the span. */
  end(): void;
}

/** Minimal tracer dependency used by stream instrumentation. */
export interface StreamsTracerPort {
  /** Start a span with stream-owned attributes and fan-in links. */
  startSpan(
    name: string,
    options?: Readonly<{
      kind?: 0 | 1 | 2 | 3 | 4;
      attributes?: Readonly<Record<string, StreamsSpanAttributeValue | undefined>>;
      links?: StreamsSpanLink[];
    }>,
  ): StreamsSpanPort;
}

/** Minimal fan-in link adapter used by stream instrumentation. */
export interface StreamsSpanLinkPort {
  /** Whether the adapter preserves link attributes. */
  readonly supportsLinkAttributes: boolean;
  /** Create a link to an upstream W3C context. */
  createLink(
    context: StreamsSpanContext,
    attributes?: Readonly<Record<string, StreamsSpanAttributeValue | undefined>>,
  ): StreamsSpanLink;
}

/** Dependencies for stream instrumentation. */
export type StreamsInstrumentationOptions = Readonly<{
  tracer?: StreamsTracerPort;
  spanLinks?: StreamsSpanLinkPort;
}>;

/** Real stream telemetry facade backed by `@netscript/telemetry`. */
export class StreamsInstrumentation {
  readonly #tracer: StreamsTracerPort;
  readonly #spanLinks: StreamsSpanLinkPort;

  /** Create stream instrumentation with optional tracer/link adapter overrides. */
  constructor(options: StreamsInstrumentationOptions = {}) {
    this.#tracer = options.tracer ?? getTracer('netscript.streams', CORE_PACKAGE_VERSION);
    this.#spanLinks = options.spanLinks ?? createOtelSdkSpanLink();
  }

  /** Publish one stream event inside a PRODUCER span and return injected headers. */
  publish(
    input: Readonly<{
      streamPath: string;
      collection: string;
      operation: string;
      producerId: string;
      messageId: string;
      correlationId?: string;
      emit: (headers: Record<string, string>) => void;
    }>,
  ): void {
    const span = this.#tracer.startSpan(StreamSpanNames.PUBLISH, {
      kind: SpanKind.PRODUCER,
      attributes: streamAttributes({
        streamPath: input.streamPath,
        collection: input.collection,
        operation: input.operation,
        producerId: input.producerId,
        messageId: input.messageId,
        correlationId: input.correlationId,
      }),
    });
    try {
      const headers: Record<string, string> = {
        traceparent: formatTraceparent(span.spanContext()),
      };
      input.emit(headers);
      span.setAttribute(StreamAttributes.OUTCOME, 'success');
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setAttribute(StreamAttributes.OUTCOME, 'error');
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  }

  /** Start a CONSUMER span for a stream subscription with fan-in links. */
  startSubscribeSpan(
    input: Readonly<{
      streamPath: string;
      collection?: string;
      operation?: string;
      messages: readonly StreamFanInMessage[];
    }>,
  ): StreamsSpanPort {
    return this.#tracer.startSpan(StreamSpanNames.SUBSCRIBE, {
      kind: SpanKind.CONSUMER,
      attributes: streamAttributes({
        streamPath: input.streamPath,
        collection: input.collection,
        operation: input.operation ?? 'subscribe',
      }),
      links: createFanInLinks(
        input.messages.map((message) => ({
          traceparent: message.traceparent,
          tracestate: message.tracestate,
          attributes: streamAttributes({
            streamPath: message.streamPath ?? input.streamPath,
            collection: message.collection ?? input.collection,
            operation: message.operation ?? input.operation ?? 'consume',
            messageId: message.messageId,
            correlationId: message.correlationId,
          }),
        })),
        this.#spanLinks,
      ),
    });
  }
}

/** Create real stream instrumentation. */
export function createStreamsInstrumentation(
  options: StreamsInstrumentationOptions = {},
): StreamsInstrumentation {
  return new StreamsInstrumentation(options);
}

/** Minimal instrumentation contract understood by NetScript telemetry hosts. */
export interface StreamsInstrumentationRegistration {
  /** Stable instrumentation name. */
  readonly name: string;
  /** Register instrumentation hooks with the host telemetry context. */
  setup(context: unknown): void;
}

/**
 * Telemetry registration for stream publish, consume, and subscribe spans.
 */
export const streamsInstrumentation: StreamsInstrumentationRegistration = {
  name: 'netscript.streams',
  setup: (_context) => {
    void StreamSpanNames;
    void StreamAttributes;
  },
};

function streamAttributes(
  input: Readonly<{
    streamPath: string;
    collection?: string;
    operation?: string;
    producerId?: string;
    messageId?: string;
    correlationId?: string;
  }>,
): StreamsTelemetryAttributes {
  return {
    [StreamAttributes.SYSTEM]: 'netscript.streams',
    [StreamAttributes.DESTINATION_NAME]: input.streamPath,
    [StreamAttributes.DESTINATION_KIND]: 'stream',
    [StreamAttributes.OPERATION_NAME]: input.operation,
    [StreamAttributes.OPERATION_TYPE]: input.operation,
    [StreamAttributes.STREAM_PATH]: input.streamPath,
    [StreamAttributes.COLLECTION]: input.collection,
    [StreamAttributes.PRODUCER_ID]: input.producerId,
    [StreamAttributes.MESSAGE_ID]: input.messageId,
    [StreamAttributes.MESSAGE_CONVERSATION_ID]: input.correlationId,
    [StreamAttributes.CORRELATION_ID]: input.correlationId,
  };
}
