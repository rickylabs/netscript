/** Trigger span names required by the production observability spec. */
export type TriggerSpanNamesMap = Readonly<{
  INGRESS: 'trigger.ingress';
  DETECT: 'trigger.detect';
  PROCESS: 'trigger.process';
  ACTION_DISPATCH: 'trigger.action.dispatch';
  DLQ_ENQUEUE: 'trigger.dlq.enqueue';
  INGRESS_RESPONSE: 'trigger.ingress.response';
}>;

/** Trigger span names keyed by lifecycle stage. */
export const TriggerSpanNames: TriggerSpanNamesMap = Object.freeze(
  {
    INGRESS: 'trigger.ingress',
    DETECT: 'trigger.detect',
    PROCESS: 'trigger.process',
    ACTION_DISPATCH: 'trigger.action.dispatch',
    DLQ_ENQUEUE: 'trigger.dlq.enqueue',
    INGRESS_RESPONSE: 'trigger.ingress.response',
  } as const,
);

/** Trigger attribute keys emitted on spans and metrics. */
export type TriggerAttributesMap = Readonly<{
  TRIGGER_ID: 'trigger.id';
  TRIGGER_EVENT_ID: 'trigger.event.id';
  TRIGGER_KIND: 'trigger.kind';
  TRIGGER_STATUS: 'trigger.status';
  TRIGGER_ATTEMPT: 'trigger.attempt';
  TRIGGER_DURABILITY_TIER: 'trigger.durability_tier';
  ACTION_KIND: 'trigger.action.kind';
  IDEMPOTENCY_KEY: 'trigger.idempotency_key';
  IDEMPOTENCY_SOURCE: 'trigger.idempotency_source';
  DLQ_REASON: 'trigger.dlq.reason';
  HTTP_STATUS_CODE: 'http.status_code';
  OUTCOME: 'outcome';
  ERROR_CLASS: 'error_class';
}>;

/** Trigger attribute keys keyed by semantic name. */
export const TriggerAttributes: TriggerAttributesMap = Object.freeze(
  {
    TRIGGER_ID: 'trigger.id',
    TRIGGER_EVENT_ID: 'trigger.event.id',
    TRIGGER_KIND: 'trigger.kind',
    TRIGGER_STATUS: 'trigger.status',
    TRIGGER_ATTEMPT: 'trigger.attempt',
    TRIGGER_DURABILITY_TIER: 'trigger.durability_tier',
    ACTION_KIND: 'trigger.action.kind',
    IDEMPOTENCY_KEY: 'trigger.idempotency_key',
    IDEMPOTENCY_SOURCE: 'trigger.idempotency_source',
    DLQ_REASON: 'trigger.dlq.reason',
    HTTP_STATUS_CODE: 'http.status_code',
    OUTCOME: 'outcome',
    ERROR_CLASS: 'error_class',
  } as const,
);

/** Metric names required by the trigger observability spec. */
export type TriggerMetricNamesMap = Readonly<{
  INGRESS_TOTAL: 'netscript_trigger_ingress_total';
  DISPATCH_DURATION_MS: 'netscript_trigger_dispatch_duration_ms';
  DLQ_TOTAL: 'netscript_trigger_dlq_total';
  IDEMPOTENCY_HITS_TOTAL: 'netscript_trigger_idempotency_hits_total';
}>;

/** Trigger metric names keyed by metric purpose. */
export const TriggerMetricNames: TriggerMetricNamesMap = Object.freeze(
  {
    INGRESS_TOTAL: 'netscript_trigger_ingress_total',
    DISPATCH_DURATION_MS: 'netscript_trigger_dispatch_duration_ms',
    DLQ_TOTAL: 'netscript_trigger_dlq_total',
    IDEMPOTENCY_HITS_TOTAL: 'netscript_trigger_idempotency_hits_total',
  } as const,
);

/** Canonical trigger telemetry outcomes. */
export type TriggerTelemetryOutcomesMap = Readonly<{
  ACCEPTED: 'accepted';
  SUCCESS: 'success';
  ERROR: 'error';
  DEFERRED: 'deferred';
  DLQ: 'dlq';
  DEDUPLICATED: 'deduplicated';
}>;

/** Trigger telemetry outcomes keyed by terminal state. */
export const TriggerTelemetryOutcomes: TriggerTelemetryOutcomesMap = Object.freeze(
  {
    ACCEPTED: 'accepted',
    SUCCESS: 'success',
    ERROR: 'error',
    DEFERRED: 'deferred',
    DLQ: 'dlq',
    DEDUPLICATED: 'deduplicated',
  } as const,
);

/** Union of trigger span name values. */
export type TriggerSpanName = (typeof TriggerSpanNames)[keyof typeof TriggerSpanNames];
/** Union of trigger attribute name values. */
export type TriggerAttributeName = (typeof TriggerAttributes)[keyof typeof TriggerAttributes];
/** Union of trigger metric name values. */
export type TriggerMetricName = (typeof TriggerMetricNames)[keyof typeof TriggerMetricNames];
/** Union of trigger telemetry outcome values. */
export type TriggerTelemetryOutcome =
  (typeof TriggerTelemetryOutcomes)[keyof typeof TriggerTelemetryOutcomes];
