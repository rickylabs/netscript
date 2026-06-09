/**
 * @module @netscript/plugin-triggers-core/public
 *
 * Curated root exports for `@netscript/plugin-triggers-core`.
 *
 * This barrel starts empty in slice F1. Later slices add only stable,
 * documented root exports that fit the 25-export budget in the v2 plan.
 */

export {
  defineFileWatch,
  defineScheduledTrigger,
  defineWebhook,
  enqueueJob,
} from '../builders/mod.ts';
export type {
  TriggerDlqPort,
  TriggerIdempotencyPort,
  TriggerIngressPort,
  TriggerProcessorPort,
  TriggerSchedulerPort,
  WebhookVerifierPort,
} from '../ports/mod.ts';
export { createTriggerIngress, createTriggerProcessor, TriggerProcessor } from '../runtime/mod.ts';
export {
  TRIGGER_BACKFILL_POLICIES,
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
} from '../builders/mod.ts';
export type { LoggerPort, TriggerProcessorOptions } from '../runtime/mod.ts';
export type {
  CronExpression,
  DeferAction,
  DefineScheduledTriggerSpec,
  EnqueueJobAction,
  EnqueueJobOptions,
  FileWatchDefinition,
  FileWatchHandler,
  FileWatchLifecycle,
  FileWatchSpec,
  FileWatchStabilityThreshold,
  FileWatchTriggerPayload,
  JobDefinition,
  JobId,
  ScheduledTriggerDefinition,
  ScheduledTriggerHandler,
  ScheduledTriggerPayload,
  ScheduledTriggerSpec,
  TriggerActionResult,
  TriggerBackfillPolicy,
  TriggerBackfillSpec,
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerContext,
  TriggerDeduplicationSpec,
  TriggerDefinitionBase,
  TriggerDurabilityTier,
  TriggerEventId,
  TriggerEventStatus,
  TriggerEvent,
  TriggerHandler,
  TriggerId,
  TriggerKind,
  TriggerKnownKind,
  TriggerPayload,
  TriggerRetryPolicy,
  ManualTriggerPayload,
  QueueTriggerPayload,
  StreamTriggerPayload,
  WebhookDefinition,
  WebhookHandler,
  WebhookId,
  WebhookSpec,
  WebhookTriggerPayload,
  WebhookVerifierKind,
} from '../builders/mod.ts';
