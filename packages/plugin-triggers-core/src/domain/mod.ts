/** @module @netscript/plugin-triggers-core/domain */

export {
  DEFAULT_TRIGGER_BACKOFF_MULTIPLIER,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_COOLDOWN_MS,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  DEFAULT_TRIGGER_CIRCUIT_BREAKER_PROBE_INTERVAL_MS,
  DEFAULT_TRIGGER_CONCURRENCY_LIMIT,
  DEFAULT_TRIGGER_DURABILITY_TIER,
  DEFAULT_TRIGGER_IDEMPOTENCY_TTL_MS,
  DEFAULT_TRIGGER_INITIAL_DELAY_MS,
  DEFAULT_TRIGGER_MAX_ATTEMPTS,
  DEFAULT_TRIGGER_MAX_DELAY_MS,
  TRIGGER_BACKFILL_POLICIES,
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_INGRESS_MAX_RESPONSE_MS,
  TRIGGER_KINDS,
  TRIGGER_RESERVED_KINDS,
  TRIGGER_RUNTIME_KINDS,
  TRIGGERS_ERROR_CODES,
} from './constants.ts';
export { TRIGGER_ACTION_KINDS } from './trigger-action.ts';
export {
  TriggerDeduplicatedError,
  TriggerKindNotImplementedError,
  TriggerNotFoundError,
  TriggersError,
  UnsupportedOperationError,
} from './errors.ts';
export type {
  TriggerBackfillPolicy,
  TriggerDurabilityTier,
  TriggerEventStatus,
  TriggerKind,
  TriggerKnownKind,
  TriggerReservedKind,
  TriggerRuntimeKind,
  TriggersErrorCode,
} from './constants.ts';
export type { JobDefinition, JobId } from '@netscript/plugin-workers-core';
export type { TriggersErrorOptions } from './errors.ts';
export type { TriggerEventId, TriggerId, WebhookId } from './ids.ts';
export type { CronExpression, ScheduledTriggerSpec } from './scheduled-spec.ts';
export type {
  DeferAction,
  EnqueueJobAction,
  EnqueueJobOptions,
  TriggerActionKind,
  TriggerActionResult,
} from './trigger-action.ts';
export type { TriggerContext } from './trigger-context.ts';
export type {
  FileWatchTriggerPayload,
  ManualTriggerPayload,
  QueueTriggerPayload,
  ScheduledTriggerPayload,
  StreamTriggerPayload,
  TriggerEvent,
  TriggerPayload,
  WebhookTriggerPayload,
} from './trigger-event.ts';
export type {
  TriggerBackfillSpec,
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerDeduplicationSpec,
  TriggerRetryPolicy,
} from './trigger-spec.ts';
export type {
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchStabilityThreshold,
  ManualTriggerDefinition,
  QueueTriggerDefinition,
  RuntimeTriggerDefinition,
  ScheduledTriggerDefinition,
  StreamTriggerDefinition,
  TriggerDefinition,
  TriggerDefinitionBase,
  TriggerHandler,
  WebhookDefinition,
  WebhookVerifierKind,
} from './trigger-definition.ts';
