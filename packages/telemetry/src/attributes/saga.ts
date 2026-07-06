/**
 * NetScript saga attribute names used by saga instrumentation.
 */
export const SagaAttributes = {
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
} as const;

/**
 * Deprecated saga aliases emitted during the beta.5 duplicate-key window.
 */
export const DeprecatedSagaAttributeAliases = {
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
} as const;

/**
 * Literal union of supported saga telemetry attribute names.
 */
export type SagaAttributeName = (typeof SagaAttributes)[keyof typeof SagaAttributes];
