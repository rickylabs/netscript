import {
  createFanInLinks,
  createSpan,
  getTracer,
  type Span,
  SpanKind,
  type SpanLinkPort,
  SpanStatusCode,
  type Tracer,
} from '@netscript/telemetry';
import { resolveTraceContextFromSpan } from '@netscript/telemetry/context';
import { createOtelSdkSpanLink } from '@netscript/telemetry/otel';
import {
  StreamAttributes,
  StreamSpanNames,
  type StreamsTelemetryAttributes,
} from './attributes.ts';

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

/** Dependencies for stream instrumentation. */
export type StreamsInstrumentationOptions = Readonly<{
  tracer?: Tracer;
  spanLinks?: SpanLinkPort;
}>;

/** Real stream telemetry facade backed by `@netscript/telemetry`. */
export class StreamsInstrumentation {
  readonly #tracer: Tracer;
  readonly #spanLinks: SpanLinkPort;

  /** Create stream instrumentation with optional tracer/link adapter overrides. */
  constructor(options: StreamsInstrumentationOptions = {}) {
    this.#tracer = options.tracer ?? getTracer('netscript.streams', '0.0.1-beta.5');
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
    const span = createSpan(this.#tracer, StreamSpanNames.PUBLISH, {
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
      const traceContext = resolveTraceContextFromSpan(span);
      const headers: Record<string, string> = { traceparent: traceContext.traceparent };
      if (traceContext.tracestate) {
        headers.tracestate = traceContext.tracestate;
      }
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
  ): Span {
    return createSpan(this.#tracer, StreamSpanNames.SUBSCRIBE, {
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
