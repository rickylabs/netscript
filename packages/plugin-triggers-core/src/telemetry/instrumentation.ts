import type { TriggerDurabilityTier, TriggerEventStatus, TriggerKind } from '../domain/mod.ts';
import {
  TriggerAttributes,
  TriggerSpanNames,
  type TriggerTelemetryOutcome,
  TriggerTelemetryOutcomes,
} from './attributes.ts';

export type TriggerTelemetryAttributeValue = string | number | boolean | undefined;
export type TriggerTelemetryAttributes = Readonly<Record<string, TriggerTelemetryAttributeValue>>;

export type TriggerTelemetrySpanKind = 'server' | 'internal' | 'producer';
export type TriggerTelemetryStatus = 'ok' | 'error';

/** Structural span boundary compatible with OpenTelemetry adapters. */
export interface TriggerTelemetrySpan {
  setAttribute(key: string, value: Exclude<TriggerTelemetryAttributeValue, undefined>): void;
  addEvent(name: string, attributes?: TriggerTelemetryAttributes): void;
  setStatus(status: TriggerTelemetryStatus, description?: string): void;
  recordException(error: unknown): void;
  end(endTime?: Date): void;
}

/** Structural tracer boundary supplied by composition roots. */
export interface TriggerTelemetryTracer {
  startSpan(
    name: string,
    options: Readonly<{
      kind: TriggerTelemetrySpanKind;
      attributes?: TriggerTelemetryAttributes;
    }>,
  ): TriggerTelemetrySpan;
}

export interface TriggerTelemetryCounter {
  add(value: number, attributes?: TriggerTelemetryAttributes): void;
}

export interface TriggerTelemetryHistogram {
  record(value: number, attributes?: TriggerTelemetryAttributes): void;
}

/** Metric instruments required by the trigger observability spec. */
export type TriggerTelemetryMeter = Readonly<{
  ingressTotal?: TriggerTelemetryCounter;
  dispatchDurationMs?: TriggerTelemetryHistogram;
  dlqTotal?: TriggerTelemetryCounter;
  idempotencyHitsTotal?: TriggerTelemetryCounter;
}>;

export type TriggerInstrumentationOptions = Readonly<{
  tracer?: TriggerTelemetryTracer;
  meter?: TriggerTelemetryMeter;
}>;

export type TriggerSpanInput = Readonly<{
  triggerId: string;
  eventId?: string;
  kind: TriggerKind;
  status?: TriggerEventStatus;
  attempt?: number;
  durabilityTier?: TriggerDurabilityTier;
}>;

export type TriggerActionDispatchInput =
  & TriggerSpanInput
  & Readonly<{
    actionKind: string;
  }>;

export type TriggerDlqInput =
  & TriggerSpanInput
  & Readonly<{
    reason?: string;
  }>;

export type TriggerIngressMetricInput =
  & TriggerSpanInput
  & Readonly<{
    outcome: TriggerTelemetryOutcome;
  }>;

export type TriggerDispatchMetricInput =
  & TriggerActionDispatchInput
  & Readonly<{
    outcome: TriggerTelemetryOutcome;
    durationMs: number;
  }>;

const NOOP_SPAN: TriggerTelemetrySpan = Object.freeze({
  setAttribute(_key: string, _value: Exclude<TriggerTelemetryAttributeValue, undefined>): void {},
  addEvent(_name: string, _attributes?: TriggerTelemetryAttributes): void {},
  setStatus(_status: TriggerTelemetryStatus, _description?: string): void {},
  recordException(_error: unknown): void {},
  end(_endTime?: Date): void {},
});

const NOOP_TRACER: TriggerTelemetryTracer = Object.freeze({
  startSpan(
    _name: string,
    _options: Readonly<{ kind: TriggerTelemetrySpanKind; attributes?: TriggerTelemetryAttributes }>,
  ): TriggerTelemetrySpan {
    return NOOP_SPAN;
  },
});

/** Trigger telemetry facade with explicit tracer and meter dependencies. */
export class TriggerInstrumentation {
  readonly tracer: TriggerTelemetryTracer;
  readonly meter?: TriggerTelemetryMeter;

  constructor(options: TriggerInstrumentationOptions = {}) {
    this.tracer = options.tracer ?? NOOP_TRACER;
    this.meter = options.meter;
  }

  startIngressSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.INGRESS, {
      kind: 'server',
      attributes: triggerAttributes(input),
    });
  }

  startDetectSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.DETECT, {
      kind: 'internal',
      attributes: triggerAttributes(input),
    });
  }

  startProcessSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.PROCESS, {
      kind: 'internal',
      attributes: triggerAttributes(input),
    });
  }

  startActionDispatchSpan(input: TriggerActionDispatchInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.ACTION_DISPATCH, {
      kind: 'producer',
      attributes: {
        ...triggerAttributes(input),
        [TriggerAttributes.ACTION_KIND]: input.actionKind,
      },
    });
  }

  startDlqEnqueueSpan(input: TriggerDlqInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.DLQ_ENQUEUE, {
      kind: 'producer',
      attributes: {
        ...triggerAttributes(input),
        [TriggerAttributes.DLQ_REASON]: input.reason,
      },
    });
  }

  startIngressResponseSpan(input: TriggerSpanInput, statusCode: number): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.INGRESS_RESPONSE, {
      kind: 'server',
      attributes: {
        ...triggerAttributes(input),
        [TriggerAttributes.HTTP_STATUS_CODE]: statusCode,
      },
    });
  }

  finishSpan(
    span: TriggerTelemetrySpan,
    outcome: TriggerTelemetryOutcome = TriggerTelemetryOutcomes.SUCCESS,
    error?: unknown,
  ): void {
    span.setAttribute(TriggerAttributes.OUTCOME, outcome);
    if (error !== undefined) {
      span.recordException(error);
      span.setAttribute(TriggerAttributes.ERROR_CLASS, errorClass(error));
      span.setStatus('error', error instanceof Error ? error.message : String(error));
    } else {
      span.setStatus('ok');
    }
    span.end();
  }

  recordIngress(input: TriggerIngressMetricInput): void {
    this.meter?.ingressTotal?.add(1, {
      ...triggerAttributes(input),
      [TriggerAttributes.OUTCOME]: input.outcome,
    });
  }

  recordDispatchDuration(input: TriggerDispatchMetricInput): void {
    this.meter?.dispatchDurationMs?.record(input.durationMs, {
      ...triggerAttributes(input),
      [TriggerAttributes.ACTION_KIND]: input.actionKind,
      [TriggerAttributes.OUTCOME]: input.outcome,
    });
  }

  recordDlq(input: TriggerDlqInput): void {
    this.meter?.dlqTotal?.add(1, {
      ...triggerAttributes(input),
      [TriggerAttributes.DLQ_REASON]: input.reason,
    });
  }

  recordIdempotencyHit(input: TriggerSpanInput, source: string): void {
    this.meter?.idempotencyHitsTotal?.add(1, {
      ...triggerAttributes(input),
      [TriggerAttributes.IDEMPOTENCY_SOURCE]: source,
    });
  }
}

/** Create trigger instrumentation with explicit dependencies. */
export function createTriggerInstrumentation(
  options: TriggerInstrumentationOptions = {},
): TriggerInstrumentation {
  return new TriggerInstrumentation(options);
}

function triggerAttributes(input: TriggerSpanInput): TriggerTelemetryAttributes {
  return {
    [TriggerAttributes.TRIGGER_ID]: input.triggerId,
    [TriggerAttributes.TRIGGER_EVENT_ID]: input.eventId,
    [TriggerAttributes.TRIGGER_KIND]: input.kind,
    [TriggerAttributes.TRIGGER_STATUS]: input.status,
    [TriggerAttributes.TRIGGER_ATTEMPT]: input.attempt,
    [TriggerAttributes.TRIGGER_DURABILITY_TIER]: input.durabilityTier,
  };
}

function errorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
