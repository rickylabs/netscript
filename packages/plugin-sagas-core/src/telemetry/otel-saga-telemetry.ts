import type { ObservableResult } from '@netscript/telemetry';
import {
  createFanInLinks,
  createSpan,
  type Exception,
  getTracer,
  type MeterPort,
  type Span,
  SpanKind,
  type SpanLinkPort,
  SpanStatusCode,
  type Tracer,
} from '@netscript/telemetry';
import { extractFromTraceContext } from '@netscript/telemetry/context';
import { createOtelDenoMeter, createOtelSdkSpanLink } from '@netscript/telemetry/otel';
import { SagaMetricNames } from './attributes.ts';
import {
  createSagaInstrumentation,
  type SagaInstrumentation,
  type SagaTelemetryAttributes,
  type SagaTelemetryMeter,
  type SagaTelemetrySpan,
  type SagaTelemetrySpanKind,
  type SagaTelemetryStatus,
  type SagaTelemetryTracer,
} from './instrumentation.ts';

/** Options for the OpenTelemetry-backed saga instrumentation factory. */
export type OtelSagaTelemetryOptions = Readonly<{
  tracer?: Tracer;
  spanLinks?: SpanLinkPort;
  meter?: MeterPort;
}>;

type OtelSagaTelemetryInput = OtelSagaTelemetryOptions | Tracer;

/** Create a structural saga tracer backed by the shared NetScript telemetry facade. */
export function createOtelSagaTracer(
  input: OtelSagaTelemetryInput = {},
): SagaTelemetryTracer {
  const options = normalizeOptions(input);
  const tracer = options.tracer ?? getTracer('netscript.sagas', '0.0.1-beta.5');
  const spanLinks = options.spanLinks ?? createOtelSdkSpanLink();
  return {
    startSpan(name, spanOptions): SagaTelemetrySpan {
      const parentContext = spanOptions.parent?.traceparent
        ? extractFromTraceContext({
          traceparent: spanOptions.parent.traceparent,
          tracestate: spanOptions.parent.tracestate,
        })
        : undefined;
      return new OtelSagaTelemetrySpan(
        createSpan(tracer, name, {
          kind: toOtelSpanKind(spanOptions.kind),
          attributes: spanOptions.attributes,
          parentContext,
          links: createFanInLinks(spanOptions.links ?? [], spanLinks),
        }),
      );
    },
  };
}

/** Create saga instrumentation wired to shared tracing, links, and saga meters. */
export function createSagaTelemetry(
  input: OtelSagaTelemetryInput = {},
): SagaInstrumentation {
  const options = normalizeOptions(input);
  return createSagaInstrumentation({
    tracer: createOtelSagaTracer(options),
    meter: createSagaTelemetryMeter(options.meter ?? createOtelDenoMeter()),
  });
}

function normalizeOptions(input: OtelSagaTelemetryInput): OtelSagaTelemetryOptions {
  return isTracer(input) ? { tracer: input } : input;
}

function isTracer(input: OtelSagaTelemetryInput): input is Tracer {
  return 'startSpan' in input && typeof input.startSpan === 'function' &&
    'startActiveSpan' in input && typeof input.startActiveSpan === 'function';
}

/** Create the seven shared saga metric instruments required by TC-11. */
export function createSagaTelemetryMeter(meterPort: MeterPort): SagaTelemetryMeter {
  const meter = meterPort.getMeter('netscript.sagas', '0.0.1-beta.5');
  let activeInstances = 0;
  const activeGauge = meter.createObservableGauge(SagaMetricNames.INSTANCES_ACTIVE);
  activeGauge.addCallback((result: ObservableResult) => {
    result.observe(activeInstances);
  });
  return {
    handleDurationMs: meter.createHistogram(SagaMetricNames.HANDLE_DURATION_MS),
    instancesActive: {
      record(value): void {
        activeInstances = value;
      },
    },
    compensationsTotal: meter.createCounter(SagaMetricNames.COMPENSATIONS_TOTAL),
    dlqTotal: meter.createCounter(SagaMetricNames.DLQ_TOTAL),
    idempotencyHitsTotal: meter.createCounter(SagaMetricNames.IDEMPOTENCY_HITS_TOTAL),
    concurrencyThrottledTotal: meter.createCounter(SagaMetricNames.CONCURRENCY_THROTTLED_TOTAL),
    replayDurationMs: meter.createHistogram(SagaMetricNames.REPLAY_DURATION_MS),
  };
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
