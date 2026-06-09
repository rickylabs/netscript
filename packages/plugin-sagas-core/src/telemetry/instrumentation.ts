import type { SagaDurabilityTier } from '../domain/mod.ts';
import {
  SagaAttributes,
  SagaMetricNames,
  SagaSpanEvents,
  SagaSpanNames,
  type SagaTelemetryOutcome,
  SagaTelemetryOutcomes,
} from './attributes.ts';

/** Attribute value accepted by the structural telemetry boundary. */
export type SagaTelemetryAttributeValue = string | number | boolean | undefined;
/** Attribute map attached to saga spans and metrics. */
export type SagaTelemetryAttributes = Readonly<Record<string, SagaTelemetryAttributeValue>>;

/** Span kind values supported by saga instrumentation. */
export type SagaTelemetrySpanKind = 'internal' | 'producer' | 'consumer';
/** Span status values supported by saga instrumentation. */
export type SagaTelemetryStatus = 'ok' | 'error';

/** Structural span boundary compatible with OpenTelemetry adapters. */
export interface SagaTelemetrySpan {
  /** Attach a single defined attribute to the span. */
  setAttribute(key: string, value: Exclude<SagaTelemetryAttributeValue, undefined>): void;
  /** Add a named event with optional attributes to the span. */
  addEvent(name: string, attributes?: SagaTelemetryAttributes): void;
  /** Set the completion status for the span. */
  setStatus(status: SagaTelemetryStatus, description?: string): void;
  /** Record an exception object on the span. */
  recordException(error: unknown): void;
  /** End the span, optionally at a supplied timestamp. */
  end(endTime?: Date): void;
}

/** Structural tracer boundary supplied by composition roots. */
export interface SagaTelemetryTracer {
  /** Start a saga telemetry span. */
  startSpan(
    name: string,
    options: Readonly<{
      kind: SagaTelemetrySpanKind;
      attributes?: SagaTelemetryAttributes;
    }>,
  ): SagaTelemetrySpan;
}

/** Counter instrument boundary used by saga metrics. */
export interface SagaTelemetryCounter {
  /** Add a delta to the counter with optional attributes. */
  add(value: number, attributes?: SagaTelemetryAttributes): void;
}

/** Histogram instrument boundary used by saga duration metrics. */
export interface SagaTelemetryHistogram {
  /** Record one observed value with optional attributes. */
  record(value: number, attributes?: SagaTelemetryAttributes): void;
}

/** Gauge instrument boundary used by active-instance metrics. */
export interface SagaTelemetryGauge {
  /** Record a current gauge value with optional attributes. */
  record(value: number, attributes?: SagaTelemetryAttributes): void;
}

/** Metric instruments required by the sagas observability spec. */
export type SagaTelemetryMeter = Readonly<{
  handleDurationMs?: SagaTelemetryHistogram;
  instancesActive?: SagaTelemetryGauge;
  compensationsTotal?: SagaTelemetryCounter;
  dlqTotal?: SagaTelemetryCounter;
  idempotencyHitsTotal?: SagaTelemetryCounter;
  concurrencyThrottledTotal?: SagaTelemetryCounter;
  replayDurationMs?: SagaTelemetryHistogram;
}>;

/** Dependencies used to create saga instrumentation. */
export type SagaInstrumentationOptions = Readonly<{
  tracer?: SagaTelemetryTracer;
  meter?: SagaTelemetryMeter;
}>;

/** Input attributes for a saga handle span. */
export type SagaHandleSpanInput = Readonly<{
  sagaId: string;
  instanceId?: string;
  eventType: string;
  attempt: number;
  durabilityTier: SagaDurabilityTier;
  correlationKey?: string;
}>;

/** Input attributes for a send cascade span. */
export type SagaCascadeSendInput = Readonly<{
  targetJobId?: string;
  idempotencyKey?: string;
  retryMaxAttempts?: number;
  concurrencyKey?: string;
  queueName?: string;
}>;

/** Input attributes for a scheduled cascade span. */
export type SagaCascadeScheduleInput = Readonly<{
  scheduledFor?: Date;
  delayMs?: number;
}>;

/** Input attributes for a child saga spawn span. */
export type SagaCascadeSpawnInput = Readonly<{
  childSagaId: string;
  childInstanceId?: string;
}>;

/** Input attributes for a compensation cascade span. */
export type SagaCascadeCompensateInput = Readonly<{
  reason?: string;
  cascadeSize: number;
}>;

/** Input attributes for saga handle duration metrics. */
export type SagaHandleMetricInput =
  & SagaHandleSpanInput
  & Readonly<{
    outcome: SagaTelemetryOutcome;
    durationMs: number;
  }>;

/** Input attributes for saga error counters. */
export type SagaErrorMetricInput = Readonly<{
  sagaId: string;
  errorClass: string;
}>;

const NOOP_SPAN: SagaTelemetrySpan = Object.freeze({
  setAttribute(_key: string, _value: Exclude<SagaTelemetryAttributeValue, undefined>): void {},
  addEvent(_name: string, _attributes?: SagaTelemetryAttributes): void {},
  setStatus(_status: SagaTelemetryStatus, _description?: string): void {},
  recordException(_error: unknown): void {},
  end(_endTime?: Date): void {},
});

const NOOP_TRACER: SagaTelemetryTracer = Object.freeze({
  startSpan(
    _name: string,
    _options: Readonly<{ kind: SagaTelemetrySpanKind; attributes?: SagaTelemetryAttributes }>,
  ): SagaTelemetrySpan {
    return NOOP_SPAN;
  },
});

/** Saga telemetry facade with explicit tracer and meter dependencies. */
export class SagaInstrumentation {
  /** Tracer used to create saga spans. */
  readonly tracer: SagaTelemetryTracer;
  /** Optional meter used to record saga metrics. */
  readonly meter?: SagaTelemetryMeter;

  /** Create instrumentation with optional tracer and meter dependencies. */
  constructor(options: SagaInstrumentationOptions = {}) {
    this.tracer = options.tracer ?? NOOP_TRACER;
    this.meter = options.meter;
  }

  /** Start a span for handling one saga event. */
  startHandleSpan(input: SagaHandleSpanInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.HANDLE, {
      kind: 'internal',
      attributes: handleAttributes(input),
    });
  }

  /** Start a span for a send cascade. */
  startCascadeSendSpan(input: SagaCascadeSendInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_SEND, {
      kind: 'producer',
      attributes: {
        [SagaAttributes.TARGET_JOB_ID]: input.targetJobId,
        [SagaAttributes.IDEMPOTENCY_KEY]: input.idempotencyKey,
        [SagaAttributes.RETRY_MAX_ATTEMPTS]: input.retryMaxAttempts,
        [SagaAttributes.CONCURRENCY_KEY]: input.concurrencyKey,
        [SagaAttributes.QUEUE_NAME]: input.queueName,
      },
    });
  }

  /** Start a span for a scheduled cascade. */
  startCascadeScheduleSpan(input: SagaCascadeScheduleInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_SCHEDULE, {
      kind: 'producer',
      attributes: {
        [SagaAttributes.SCHEDULED_FOR]: input.scheduledFor?.toISOString(),
        [SagaAttributes.DELAY_MS]: input.delayMs,
      },
    });
  }

  /** Start a span for a child saga spawn cascade. */
  startCascadeSpawnSpan(input: SagaCascadeSpawnInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_SPAWN, {
      kind: 'producer',
      attributes: {
        [SagaAttributes.CHILD_SAGA_ID]: input.childSagaId,
        [SagaAttributes.CHILD_INSTANCE_ID]: input.childInstanceId,
      },
    });
  }

  /** Start a span for a compensation cascade. */
  startCascadeCompensateSpan(input: SagaCascadeCompensateInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_COMPENSATE, {
      kind: 'internal',
      attributes: {
        [SagaAttributes.COMPENSATION_REASON]: input.reason,
        [SagaAttributes.COMPENSATION_CASCADE_SIZE]: input.cascadeSize,
      },
    });
  }

  /** Start a span for cascade completion bookkeeping. */
  startCascadeCompleteSpan(): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_COMPLETE, { kind: 'internal' });
  }

  /** Record a state-before event on a saga span. */
  recordStateBefore(span: SagaTelemetrySpan, attributes: SagaTelemetryAttributes = {}): void {
    span.addEvent(SagaSpanEvents.STATE_BEFORE, attributes);
  }

  /** Record a state-after event on a saga span. */
  recordStateAfter(span: SagaTelemetrySpan, attributes: SagaTelemetryAttributes = {}): void {
    span.addEvent(SagaSpanEvents.STATE_AFTER, attributes);
  }

  /** Finish a saga span with outcome and optional error details. */
  finishSpan(
    span: SagaTelemetrySpan,
    outcome: SagaTelemetryOutcome = SagaTelemetryOutcomes.SUCCESS,
    error?: unknown,
  ): void {
    span.setAttribute(SagaAttributes.OUTCOME, outcome);
    if (error !== undefined) {
      span.recordException(error);
      span.setStatus('error', error instanceof Error ? error.message : String(error));
    } else {
      span.setStatus('ok');
    }
    span.end();
  }

  /** Record saga event handling duration. */
  recordHandleDuration(input: SagaHandleMetricInput): void {
    this.meter?.handleDurationMs?.record(input.durationMs, {
      [SagaAttributes.SAGA_ID]: input.sagaId,
      [SagaAttributes.SAGA_EVENT_TYPE]: input.eventType,
      [SagaAttributes.OUTCOME]: input.outcome,
    });
  }

  /** Record the current active instance count for a saga. */
  recordInstancesActive(sagaId: string, activeInstances: number): void {
    this.meter?.instancesActive?.record(activeInstances, {
      [SagaAttributes.SAGA_ID]: sagaId,
    });
  }

  /** Record one compensation event. */
  recordCompensation(sagaId: string, reason: string): void {
    this.meter?.compensationsTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
      [SagaAttributes.COMPENSATION_REASON]: reason,
    });
  }

  /** Record one dead-lettered saga event. */
  recordDlq(input: SagaErrorMetricInput): void {
    this.meter?.dlqTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: input.sagaId,
      [SagaAttributes.ERROR_CLASS]: input.errorClass,
    });
  }

  /** Record one idempotency hit. */
  recordIdempotencyHit(sagaId: string): void {
    this.meter?.idempotencyHitsTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
    });
  }

  /** Record one concurrency-throttled dispatch. */
  recordConcurrencyThrottled(sagaId: string, concurrencyKey: string): void {
    this.meter?.concurrencyThrottledTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
      [SagaAttributes.CONCURRENCY_KEY]: concurrencyKey,
    });
  }

  /** Record saga replay duration. */
  recordReplayDuration(sagaId: string, durationMs: number): void {
    this.meter?.replayDurationMs?.record(durationMs, {
      [SagaAttributes.SAGA_ID]: sagaId,
    });
  }
}

/** Create saga instrumentation with explicit dependencies. */
export function createSagaInstrumentation(
  options: SagaInstrumentationOptions = {},
): SagaInstrumentation {
  return new SagaInstrumentation(options);
}

function handleAttributes(input: SagaHandleSpanInput): SagaTelemetryAttributes {
  return {
    [SagaAttributes.SAGA_ID]: input.sagaId,
    [SagaAttributes.SAGA_INSTANCE_ID]: input.instanceId,
    [SagaAttributes.SAGA_EVENT_TYPE]: input.eventType,
    [SagaAttributes.SAGA_ATTEMPT]: input.attempt,
    [SagaAttributes.SAGA_DURABILITY_TIER]: input.durabilityTier,
    [SagaAttributes.SAGA_CORRELATION_KEY]: input.correlationKey,
  };
}
