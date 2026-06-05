import type { SagaDurabilityTier } from '../domain/mod.ts';
import {
  SagaAttributes,
  SagaMetricNames,
  SagaSpanEvents,
  SagaSpanNames,
  type SagaTelemetryOutcome,
  SagaTelemetryOutcomes,
} from './attributes.ts';

export type SagaTelemetryAttributeValue = string | number | boolean | undefined;
export type SagaTelemetryAttributes = Readonly<Record<string, SagaTelemetryAttributeValue>>;

export type SagaTelemetrySpanKind = 'internal' | 'producer' | 'consumer';
export type SagaTelemetryStatus = 'ok' | 'error';

/** Structural span boundary compatible with OpenTelemetry adapters. */
export interface SagaTelemetrySpan {
  setAttribute(key: string, value: Exclude<SagaTelemetryAttributeValue, undefined>): void;
  addEvent(name: string, attributes?: SagaTelemetryAttributes): void;
  setStatus(status: SagaTelemetryStatus, description?: string): void;
  recordException(error: unknown): void;
  end(endTime?: Date): void;
}

/** Structural tracer boundary supplied by composition roots. */
export interface SagaTelemetryTracer {
  startSpan(
    name: string,
    options: Readonly<{
      kind: SagaTelemetrySpanKind;
      attributes?: SagaTelemetryAttributes;
    }>,
  ): SagaTelemetrySpan;
}

export interface SagaTelemetryCounter {
  add(value: number, attributes?: SagaTelemetryAttributes): void;
}

export interface SagaTelemetryHistogram {
  record(value: number, attributes?: SagaTelemetryAttributes): void;
}

export interface SagaTelemetryGauge {
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

export type SagaInstrumentationOptions = Readonly<{
  tracer?: SagaTelemetryTracer;
  meter?: SagaTelemetryMeter;
}>;

export type SagaHandleSpanInput = Readonly<{
  sagaId: string;
  instanceId?: string;
  eventType: string;
  attempt: number;
  durabilityTier: SagaDurabilityTier;
  correlationKey?: string;
}>;

export type SagaCascadeSendInput = Readonly<{
  targetJobId?: string;
  idempotencyKey?: string;
  retryMaxAttempts?: number;
  concurrencyKey?: string;
  queueName?: string;
}>;

export type SagaCascadeScheduleInput = Readonly<{
  scheduledFor?: Date;
  delayMs?: number;
}>;

export type SagaCascadeSpawnInput = Readonly<{
  childSagaId: string;
  childInstanceId?: string;
}>;

export type SagaCascadeCompensateInput = Readonly<{
  reason?: string;
  cascadeSize: number;
}>;

export type SagaHandleMetricInput =
  & SagaHandleSpanInput
  & Readonly<{
    outcome: SagaTelemetryOutcome;
    durationMs: number;
  }>;

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
  readonly tracer: SagaTelemetryTracer;
  readonly meter?: SagaTelemetryMeter;

  constructor(options: SagaInstrumentationOptions = {}) {
    this.tracer = options.tracer ?? NOOP_TRACER;
    this.meter = options.meter;
  }

  startHandleSpan(input: SagaHandleSpanInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.HANDLE, {
      kind: 'internal',
      attributes: handleAttributes(input),
    });
  }

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

  startCascadeScheduleSpan(input: SagaCascadeScheduleInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_SCHEDULE, {
      kind: 'producer',
      attributes: {
        [SagaAttributes.SCHEDULED_FOR]: input.scheduledFor?.toISOString(),
        [SagaAttributes.DELAY_MS]: input.delayMs,
      },
    });
  }

  startCascadeSpawnSpan(input: SagaCascadeSpawnInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_SPAWN, {
      kind: 'producer',
      attributes: {
        [SagaAttributes.CHILD_SAGA_ID]: input.childSagaId,
        [SagaAttributes.CHILD_INSTANCE_ID]: input.childInstanceId,
      },
    });
  }

  startCascadeCompensateSpan(input: SagaCascadeCompensateInput): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_COMPENSATE, {
      kind: 'internal',
      attributes: {
        [SagaAttributes.COMPENSATION_REASON]: input.reason,
        [SagaAttributes.COMPENSATION_CASCADE_SIZE]: input.cascadeSize,
      },
    });
  }

  startCascadeCompleteSpan(): SagaTelemetrySpan {
    return this.tracer.startSpan(SagaSpanNames.CASCADE_COMPLETE, { kind: 'internal' });
  }

  recordStateBefore(span: SagaTelemetrySpan, attributes: SagaTelemetryAttributes = {}): void {
    span.addEvent(SagaSpanEvents.STATE_BEFORE, attributes);
  }

  recordStateAfter(span: SagaTelemetrySpan, attributes: SagaTelemetryAttributes = {}): void {
    span.addEvent(SagaSpanEvents.STATE_AFTER, attributes);
  }

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

  recordHandleDuration(input: SagaHandleMetricInput): void {
    this.meter?.handleDurationMs?.record(input.durationMs, {
      [SagaAttributes.SAGA_ID]: input.sagaId,
      [SagaAttributes.SAGA_EVENT_TYPE]: input.eventType,
      [SagaAttributes.OUTCOME]: input.outcome,
    });
  }

  recordInstancesActive(sagaId: string, activeInstances: number): void {
    this.meter?.instancesActive?.record(activeInstances, {
      [SagaAttributes.SAGA_ID]: sagaId,
    });
  }

  recordCompensation(sagaId: string, reason: string): void {
    this.meter?.compensationsTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
      [SagaAttributes.COMPENSATION_REASON]: reason,
    });
  }

  recordDlq(input: SagaErrorMetricInput): void {
    this.meter?.dlqTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: input.sagaId,
      [SagaAttributes.ERROR_CLASS]: input.errorClass,
    });
  }

  recordIdempotencyHit(sagaId: string): void {
    this.meter?.idempotencyHitsTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
    });
  }

  recordConcurrencyThrottled(sagaId: string, concurrencyKey: string): void {
    this.meter?.concurrencyThrottledTotal?.add(1, {
      [SagaAttributes.SAGA_ID]: sagaId,
      [SagaAttributes.CONCURRENCY_KEY]: concurrencyKey,
    });
  }

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
