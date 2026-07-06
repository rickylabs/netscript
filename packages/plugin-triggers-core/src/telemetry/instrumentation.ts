import type { TriggerDurabilityTier, TriggerEventStatus, TriggerKind } from '../domain/mod.ts';
import {
  DeprecatedTriggerAttributes,
  TriggerAttributes,
  TriggerSpanNames,
  type TriggerTelemetryOutcome,
  TriggerTelemetryOutcomes,
} from './attributes.ts';

/** Attribute value accepted by trigger telemetry spans and metrics. */
export type TriggerTelemetryAttributeValue = string | number | boolean | undefined;
/** Attribute map accepted by trigger telemetry spans and metrics. */
export type TriggerTelemetryAttributes = Readonly<Record<string, TriggerTelemetryAttributeValue>>;

/** Span kind values used by trigger telemetry. */
export type TriggerTelemetrySpanKind = 'server' | 'internal' | 'producer';
/** Span status values used by trigger telemetry. */
export type TriggerTelemetryStatus = 'ok' | 'error';

/** Structural span boundary compatible with OpenTelemetry adapters. */
export interface TriggerTelemetrySpan {
  /** Set a scalar attribute on the span. */
  setAttribute(key: string, value: Exclude<TriggerTelemetryAttributeValue, undefined>): void;
  /** Add a named event to the span. */
  addEvent(name: string, attributes?: TriggerTelemetryAttributes): void;
  /** Set the final span status. */
  setStatus(status: TriggerTelemetryStatus, description?: string): void;
  /** Record an exception on the span. */
  recordException(error: unknown): void;
  /** End the span at the optional end time. */
  end(endTime?: Date): void;
}

/** Structural tracer boundary supplied by composition roots. */
export interface TriggerTelemetryTracer {
  /** Start a telemetry span. */
  startSpan(
    name: string,
    options: Readonly<{
      kind: TriggerTelemetrySpanKind;
      attributes?: TriggerTelemetryAttributes;
    }>,
  ): TriggerTelemetrySpan;
}

/** Structural counter instrument boundary. */
export interface TriggerTelemetryCounter {
  /** Add a value to the counter. */
  add(value: number, attributes?: TriggerTelemetryAttributes): void;
}

/** Structural histogram instrument boundary. */
export interface TriggerTelemetryHistogram {
  /** Record a value in the histogram. */
  record(value: number, attributes?: TriggerTelemetryAttributes): void;
}

/** Metric instruments required by the trigger observability spec. */
export type TriggerTelemetryMeter = Readonly<{
  ingressTotal?: TriggerTelemetryCounter;
  dispatchDurationMs?: TriggerTelemetryHistogram;
  dlqTotal?: TriggerTelemetryCounter;
  idempotencyHitsTotal?: TriggerTelemetryCounter;
}>;

/** Options for trigger instrumentation composition. */
export type TriggerInstrumentationOptions = Readonly<{
  tracer?: TriggerTelemetryTracer;
  meter?: TriggerTelemetryMeter;
}>;

/** Common trigger span input attributes. */
export type TriggerSpanInput = Readonly<{
  triggerId: string;
  eventId?: string;
  kind: TriggerKind;
  status?: TriggerEventStatus;
  attempt?: number;
  durabilityTier?: TriggerDurabilityTier;
}>;

/** Input attributes for action dispatch spans and metrics. */
export type TriggerActionDispatchInput =
  & TriggerSpanInput
  & Readonly<{
    actionKind: string;
  }>;

/** Input attributes for DLQ spans and metrics. */
export type TriggerDlqInput =
  & TriggerSpanInput
  & Readonly<{
    reason?: string;
  }>;

/** Input attributes for ingress metrics. */
export type TriggerIngressMetricInput =
  & TriggerSpanInput
  & Readonly<{
    outcome: TriggerTelemetryOutcome;
  }>;

/** Input attributes for dispatch duration metrics. */
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
  /** Tracer used to create trigger spans. */
  readonly tracer: TriggerTelemetryTracer;
  /** Optional meter used to record trigger metrics. */
  readonly meter?: TriggerTelemetryMeter;

  /** Create trigger instrumentation with optional tracer and meter dependencies. */
  constructor(options: TriggerInstrumentationOptions = {}) {
    this.tracer = options.tracer ?? NOOP_TRACER;
    this.meter = options.meter;
  }

  /** Start an ingress span. */
  startIngressSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.INGRESS, {
      kind: 'server',
      attributes: withDeprecatedAliases(triggerAttributes(input)),
    });
  }

  /** Start a trigger detection span. */
  startDetectSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.DETECT, {
      kind: 'internal',
      attributes: withDeprecatedAliases(triggerAttributes(input)),
    });
  }

  /** Start a trigger processing span. */
  startProcessSpan(input: TriggerSpanInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.PROCESS, {
      kind: 'internal',
      attributes: withDeprecatedAliases(triggerAttributes(input)),
    });
  }

  /** Start an action dispatch span. */
  startActionDispatchSpan(input: TriggerActionDispatchInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.ACTION_DISPATCH, {
      kind: 'producer',
      attributes: withDeprecatedAliases({
        ...triggerAttributes(input),
        [TriggerAttributes.ACTION_KIND]: input.actionKind,
      }),
    });
  }

  /** Start a DLQ enqueue span. */
  startDlqEnqueueSpan(input: TriggerDlqInput): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.DLQ_ENQUEUE, {
      kind: 'producer',
      attributes: withDeprecatedAliases({
        ...triggerAttributes(input),
        [TriggerAttributes.DLQ_REASON]: input.reason,
      }),
    });
  }

  /** Start an ingress response span. */
  startIngressResponseSpan(input: TriggerSpanInput, statusCode: number): TriggerTelemetrySpan {
    return this.tracer.startSpan(TriggerSpanNames.INGRESS_RESPONSE, {
      kind: 'server',
      attributes: withDeprecatedAliases({
        ...triggerAttributes(input),
        [TriggerAttributes.HTTP_STATUS_CODE]: statusCode,
      }),
    });
  }

  /** Finish a span with outcome and optional error details. */
  finishSpan(
    span: TriggerTelemetrySpan,
    outcome: TriggerTelemetryOutcome = TriggerTelemetryOutcomes.SUCCESS,
    error?: unknown,
  ): void {
    setSpanAttribute(span, TriggerAttributes.OUTCOME, outcome);
    if (error !== undefined) {
      span.recordException(error);
      setSpanAttribute(span, TriggerAttributes.ERROR_CLASS, errorClass(error));
      span.setStatus('error', error instanceof Error ? error.message : String(error));
    } else {
      span.setStatus('ok');
    }
    span.end();
  }

  /** Record an ingress metric. */
  recordIngress(input: TriggerIngressMetricInput): void {
    this.meter?.ingressTotal?.add(1, withDeprecatedAliases({
      ...triggerAttributes(input),
      [TriggerAttributes.OUTCOME]: input.outcome,
    }));
  }

  /** Record an action dispatch duration metric. */
  recordDispatchDuration(input: TriggerDispatchMetricInput): void {
    this.meter?.dispatchDurationMs?.record(input.durationMs, withDeprecatedAliases({
      ...triggerAttributes(input),
      [TriggerAttributes.ACTION_KIND]: input.actionKind,
      [TriggerAttributes.OUTCOME]: input.outcome,
    }));
  }

  /** Record a DLQ enqueue metric. */
  recordDlq(input: TriggerDlqInput): void {
    this.meter?.dlqTotal?.add(1, withDeprecatedAliases({
      ...triggerAttributes(input),
      [TriggerAttributes.DLQ_REASON]: input.reason,
    }));
  }

  /** Record an idempotency hit metric. */
  recordIdempotencyHit(input: TriggerSpanInput, source: string): void {
    this.meter?.idempotencyHitsTotal?.add(1, withDeprecatedAliases({
      ...triggerAttributes(input),
      [TriggerAttributes.IDEMPOTENCY_SOURCE]: source,
    }));
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

/**
 * Return the attribute bag with deprecated pre-#402 bare `trigger.*` aliases
 * mirrored from their canonical `netscript.trigger.*` keys.
 *
 * Emitted during the deprecation window so consumers keyed on the old names
 * keep working. Only defined values are mirrored, so absent attributes stay
 * absent under both keys.
 */
function withDeprecatedAliases(
  attributes: TriggerTelemetryAttributes,
): TriggerTelemetryAttributes {
  const result: Record<string, TriggerTelemetryAttributeValue> = { ...attributes };
  for (const [canonicalKey, deprecatedKey] of Object.entries(DeprecatedTriggerAttributes)) {
    const value = result[canonicalKey];
    if (value !== undefined) {
      result[deprecatedKey] = value;
    }
  }
  return result;
}

/**
 * Set a span attribute under both its canonical key and, when one exists, the
 * deprecated pre-#402 alias.
 */
function setSpanAttribute(
  span: TriggerTelemetrySpan,
  key: string,
  value: Exclude<TriggerTelemetryAttributeValue, undefined>,
): void {
  span.setAttribute(key, value);
  const deprecatedKey = DeprecatedTriggerAttributes[key];
  if (deprecatedKey !== undefined) {
    span.setAttribute(deprecatedKey, value);
  }
}

function errorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
