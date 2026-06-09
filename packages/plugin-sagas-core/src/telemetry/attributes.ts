/** Saga span names required by the production observability spec. */
export type SagaSpanNamesMap = Readonly<{
  HANDLE: 'saga.handle';
  CASCADE_SEND: 'saga.cascade.send';
  CASCADE_SCHEDULE: 'saga.cascade.schedule';
  CASCADE_SPAWN: 'saga.cascade.spawn';
  CASCADE_COMPENSATE: 'saga.cascade.compensate';
  CASCADE_COMPLETE: 'saga.cascade.complete';
}>;

/** Canonical span names emitted by saga runtime operations. */
export const SagaSpanNames: SagaSpanNamesMap = Object.freeze(
  {
    HANDLE: 'saga.handle',
    CASCADE_SEND: 'saga.cascade.send',
    CASCADE_SCHEDULE: 'saga.cascade.schedule',
    CASCADE_SPAWN: 'saga.cascade.spawn',
    CASCADE_COMPENSATE: 'saga.cascade.compensate',
    CASCADE_COMPLETE: 'saga.cascade.complete',
  } as const,
);

/** Saga attribute keys emitted on spans and metrics. */
export type SagaAttributesMap = Readonly<{
  SAGA_ID: 'saga.id';
  SAGA_INSTANCE_ID: 'saga.instance.id';
  SAGA_EVENT_TYPE: 'saga.event.type';
  SAGA_ATTEMPT: 'saga.attempt';
  SAGA_DURABILITY_TIER: 'saga.durability_tier';
  SAGA_CORRELATION_KEY: 'saga.correlation_key';
  TARGET_JOB_ID: 'target.job.id';
  IDEMPOTENCY_KEY: 'idempotency.key';
  RETRY_MAX_ATTEMPTS: 'retry.max_attempts';
  CONCURRENCY_KEY: 'concurrency.key';
  QUEUE_NAME: 'queue.name';
  SCHEDULED_FOR: 'scheduled.for';
  DELAY_MS: 'delay.ms';
  CHILD_SAGA_ID: 'child.saga.id';
  CHILD_INSTANCE_ID: 'child.instance.id';
  COMPENSATION_REASON: 'compensation.reason';
  COMPENSATION_CASCADE_SIZE: 'compensation.cascade_size';
  ERROR_CLASS: 'error_class';
  OUTCOME: 'outcome';
}>;

/** Canonical attribute keys emitted by saga spans and metrics. */
export const SagaAttributes: SagaAttributesMap = Object.freeze(
  {
    SAGA_ID: 'saga.id',
    SAGA_INSTANCE_ID: 'saga.instance.id',
    SAGA_EVENT_TYPE: 'saga.event.type',
    SAGA_ATTEMPT: 'saga.attempt',
    SAGA_DURABILITY_TIER: 'saga.durability_tier',
    SAGA_CORRELATION_KEY: 'saga.correlation_key',
    TARGET_JOB_ID: 'target.job.id',
    IDEMPOTENCY_KEY: 'idempotency.key',
    RETRY_MAX_ATTEMPTS: 'retry.max_attempts',
    CONCURRENCY_KEY: 'concurrency.key',
    QUEUE_NAME: 'queue.name',
    SCHEDULED_FOR: 'scheduled.for',
    DELAY_MS: 'delay.ms',
    CHILD_SAGA_ID: 'child.saga.id',
    CHILD_INSTANCE_ID: 'child.instance.id',
    COMPENSATION_REASON: 'compensation.reason',
    COMPENSATION_CASCADE_SIZE: 'compensation.cascade_size',
    ERROR_CLASS: 'error_class',
    OUTCOME: 'outcome',
  } as const,
);

/** Saga span event names used for state-transition breadcrumbs. */
export type SagaSpanEventsMap = Readonly<{
  STATE_BEFORE: 'state.before';
  STATE_AFTER: 'state.after';
}>;

/** Canonical span events used to annotate state snapshots. */
export const SagaSpanEvents: SagaSpanEventsMap = Object.freeze(
  {
    STATE_BEFORE: 'state.before',
    STATE_AFTER: 'state.after',
  } as const,
);

/** Metric names required by architecture-v2 section 6. */
export type SagaMetricNamesMap = Readonly<{
  HANDLE_DURATION_MS: 'netscript_saga_handle_duration_ms';
  INSTANCES_ACTIVE: 'netscript_saga_instances_active';
  COMPENSATIONS_TOTAL: 'netscript_saga_compensations_total';
  DLQ_TOTAL: 'netscript_saga_dlq_total';
  IDEMPOTENCY_HITS_TOTAL: 'netscript_saga_idempotency_hits_total';
  CONCURRENCY_THROTTLED_TOTAL: 'netscript_saga_concurrency_throttled_total';
  REPLAY_DURATION_MS: 'netscript_saga_replay_duration_ms';
}>;

/** Canonical metric names emitted by saga instrumentation. */
export const SagaMetricNames: SagaMetricNamesMap = Object.freeze(
  {
    HANDLE_DURATION_MS: 'netscript_saga_handle_duration_ms',
    INSTANCES_ACTIVE: 'netscript_saga_instances_active',
    COMPENSATIONS_TOTAL: 'netscript_saga_compensations_total',
    DLQ_TOTAL: 'netscript_saga_dlq_total',
    IDEMPOTENCY_HITS_TOTAL: 'netscript_saga_idempotency_hits_total',
    CONCURRENCY_THROTTLED_TOTAL: 'netscript_saga_concurrency_throttled_total',
    REPLAY_DURATION_MS: 'netscript_saga_replay_duration_ms',
  } as const,
);

/** Canonical saga telemetry outcomes. */
export type SagaTelemetryOutcomesMap = Readonly<{
  SUCCESS: 'success';
  ERROR: 'error';
  COMPENSATED: 'compensated';
  SKIPPED: 'skipped';
}>;

/** Canonical outcome values attached to saga spans and metrics. */
export const SagaTelemetryOutcomes: SagaTelemetryOutcomesMap = Object.freeze(
  {
    SUCCESS: 'success',
    ERROR: 'error',
    COMPENSATED: 'compensated',
    SKIPPED: 'skipped',
  } as const,
);

/** Literal union of supported saga span names. */
export type SagaSpanName = (typeof SagaSpanNames)[keyof typeof SagaSpanNames];
/** Literal union of supported saga telemetry attribute names. */
export type SagaAttributeName = (typeof SagaAttributes)[keyof typeof SagaAttributes];
/** Literal union of supported saga span event names. */
export type SagaSpanEventName = (typeof SagaSpanEvents)[keyof typeof SagaSpanEvents];
/** Literal union of supported saga metric names. */
export type SagaMetricName = (typeof SagaMetricNames)[keyof typeof SagaMetricNames];
/** Literal union of supported saga telemetry outcome values. */
export type SagaTelemetryOutcome =
  (typeof SagaTelemetryOutcomes)[keyof typeof SagaTelemetryOutcomes];
