import {
  createSagaInstrumentation,
  type SagaInstrumentation,
  type SagaTelemetryAttributes,
  type SagaTelemetrySpan,
  type SagaTelemetrySpanKind,
  type SagaTelemetryStatus,
  type SagaTelemetryTracer,
} from '@netscript/plugin-sagas-core/telemetry';
import { extractFromTraceContext } from '@netscript/telemetry/context';
import {
  createSpan,
  type Exception,
  getSagaTracer,
  type Span,
  SpanKind,
  SpanStatusCode,
  type Tracer,
} from '@netscript/telemetry/tracer';

/** Create a structural saga tracer backed by the NetScript OpenTelemetry facade. */
export function createOtelSagaTracer(tracer: Tracer = getSagaTracer()): SagaTelemetryTracer {
  return {
    startSpan(name, options): SagaTelemetrySpan {
      const parentContext = options.parent?.traceparent
        ? extractFromTraceContext({
          traceparent: options.parent.traceparent,
          tracestate: options.parent.tracestate,
        })
        : undefined;
      return new OtelSagaTelemetrySpan(
        createSpan(tracer, name, {
          kind: toOtelSpanKind(options.kind),
          attributes: options.attributes,
          parentContext,
        }),
      );
    },
  };
}

/** Create saga instrumentation wired to an OpenTelemetry saga tracer. */
export function createSagaTelemetry(tracer: Tracer = getSagaTracer()): SagaInstrumentation {
  return createSagaInstrumentation({ tracer: createOtelSagaTracer(tracer) });
}

class OtelSagaTelemetrySpan implements SagaTelemetrySpan {
  constructor(private readonly span: Span) {}

  setAttribute(key: string, value: string | number | boolean): void {
    this.span.setAttribute(key, value);
  }

  addEvent(name: string, attributes?: SagaTelemetryAttributes): void {
    this.span.addEvent(name, attributes);
  }

  setStatus(status: SagaTelemetryStatus, description?: string): void {
    this.span.setStatus({
      code: status === 'error' ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      message: description,
    });
  }

  recordException(error: unknown): void {
    this.span.recordException(toOtelException(error));
  }

  end(endTime?: Date): void {
    this.span.end(endTime);
  }
}

function toOtelSpanKind(kind: SagaTelemetrySpanKind): SpanKind {
  switch (kind) {
    case 'producer':
      return SpanKind.PRODUCER;
    case 'consumer':
      return SpanKind.CONSUMER;
    case 'internal':
      return SpanKind.INTERNAL;
  }
}

function toOtelException(error: unknown): Exception {
  if (error instanceof Error || typeof error === 'string') {
    return error;
  }
  if (isRecord(error)) {
    return {
      name: typeof error.name === 'string' ? error.name : undefined,
      message: typeof error.message === 'string' ? error.message : String(error),
      code: typeof error.code === 'string' ? error.code : undefined,
      stack: typeof error.stack === 'string' ? error.stack : undefined,
    };
  }
  return String(error);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
