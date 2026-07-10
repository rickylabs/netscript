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
export const SagaSpanNames: SagaSpanNamesMap = Object.freeze({
  HANDLE: 'saga.handle',
  CASCADE_SEND: 'saga.cascade.send',
  CASCADE_SCHEDULE: 'saga.cascade.schedule',
  CASCADE_SPAWN: 'saga.cascade.spawn',
  CASCADE_COMPENSATE: 'saga.cascade.compensate',
  CASCADE_COMPLETE: 'saga.cascade.complete',
});

/** Saga attribute keys emitted on spans and metrics. */
export type SagaAttributesMap = Readonly<{
  SAGA_ID: 'netscript.saga.id';
  SAGA_INSTANCE_ID: 'netscript.saga.instance.id';
  SAGA_EVENT_TYPE: 'netscript.saga.event.type';
  SAGA_ATTEMPT: 'netscript.saga.attempt';
  SAGA_DURABILITY_TIER: 'netscript.saga.durability_tier';
  SAGA_CORRELATION_KEY: 'netscript.saga.correlation_key';
  TARGET_JOB_ID: 'netscript.job.target.id';
  IDEMPOTENCY_KEY: 'netscript.idempotency.key';
  RETRY_MAX_ATTEMPTS: 'netscript.retry.max_attempts';
  CONCURRENCY_KEY: 'netscript.concurrency.key';
  QUEUE_NAME: 'messaging.destination.name';
  SCHEDULED_FOR: 'netscript.saga.scheduled_for';
  DELAY_MS: 'netscript.saga.delay_ms';
  CHILD_SAGA_ID: 'netscript.saga.child.id';
  CHILD_INSTANCE_ID: 'netscript.saga.child.instance.id';
  COMPENSATION_REASON: 'netscript.saga.compensation.reason';
  COMPENSATION_CASCADE_SIZE: 'netscript.saga.compensation.cascade_size';
  ERROR_CLASS: 'error.type';
  OUTCOME: 'netscript.outcome';
  STATUS: 'netscript.saga.status';
}>;

/** Canonical attribute keys emitted by saga spans and metrics. */
export const SagaAttributes: SagaAttributesMap = Object.freeze({
  SAGA_ID: 'netscript.saga.id',
  SAGA_INSTANCE_ID: 'netscript.saga.instance.id',
  SAGA_EVENT_TYPE: 'netscript.saga.event.type',
  SAGA_ATTEMPT: 'netscript.saga.attempt',
  SAGA_DURABILITY_TIER: 'netscript.saga.durability_tier',
  SAGA_CORRELATION_KEY: 'netscript.saga.correlation_key',
  TARGET_JOB_ID: 'netscript.job.target.id',
  IDEMPOTENCY_KEY: 'netscript.idempotency.key',
  RETRY_MAX_ATTEMPTS: 'netscript.retry.max_attempts',
  CONCURRENCY_KEY: 'netscript.concurrency.key',
  QUEUE_NAME: 'messaging.destination.name',
  SCHEDULED_FOR: 'netscript.saga.scheduled_for',
  DELAY_MS: 'netscript.saga.delay_ms',
  CHILD_SAGA_ID: 'netscript.saga.child.id',
  CHILD_INSTANCE_ID: 'netscript.saga.child.instance.id',
  COMPENSATION_REASON: 'netscript.saga.compensation.reason',
  COMPENSATION_CASCADE_SIZE: 'netscript.saga.compensation.cascade_size',
  ERROR_CLASS: 'error.type',
  OUTCOME: 'netscript.outcome',
  STATUS: 'netscript.saga.status',
});

/** Saga span event names used for state-transition breadcrumbs. */
export type SagaSpanEventsMap = Readonly<{
  STATE_BEFORE: 'state.before';
  STATE_AFTER: 'state.after';
}>;

/** Canonical span events used to annotate state snapshots. */
export const SagaSpanEvents: SagaSpanEventsMap = Object.freeze({
  STATE_BEFORE: 'state.before',
  STATE_AFTER: 'state.after',
});

/** Metric names required by architecture-v2 section 6. */
export type SagaMetricNamesMap = Readonly<{
  HANDLE_DURATION_MS: 'netscript.saga.handle.duration_ms';
  INSTANCES_ACTIVE: 'netscript.saga.instances.active';
  COMPENSATIONS_TOTAL: 'netscript.saga.compensations.total';
  DLQ_TOTAL: 'netscript.saga.dlq.total';
  IDEMPOTENCY_HITS_TOTAL: 'netscript.saga.idempotency_hits.total';
  CONCURRENCY_THROTTLED_TOTAL: 'netscript.saga.concurrency_throttled.total';
  REPLAY_DURATION_MS: 'netscript.saga.replay.duration_ms';
}>;

/** Canonical metric names emitted by saga instrumentation. */
export const SagaMetricNames: SagaMetricNamesMap = Object.freeze({
  HANDLE_DURATION_MS: 'netscript.saga.handle.duration_ms',
  INSTANCES_ACTIVE: 'netscript.saga.instances.active',
  COMPENSATIONS_TOTAL: 'netscript.saga.compensations.total',
  DLQ_TOTAL: 'netscript.saga.dlq.total',
  IDEMPOTENCY_HITS_TOTAL: 'netscript.saga.idempotency_hits.total',
  CONCURRENCY_THROTTLED_TOTAL: 'netscript.saga.concurrency_throttled.total',
  REPLAY_DURATION_MS: 'netscript.saga.replay.duration_ms',
});

/** Canonical saga telemetry outcomes. */
export type SagaTelemetryOutcomesMap = Readonly<{
  SUCCESS: 'success';
  ERROR: 'error';
  COMPENSATED: 'compensated';
  SKIPPED: 'skipped';
}>;

/** Canonical outcome values attached to saga spans and metrics. */
export const SagaTelemetryOutcomes: SagaTelemetryOutcomesMap = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  COMPENSATED: 'compensated',
  SKIPPED: 'skipped',
});

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
