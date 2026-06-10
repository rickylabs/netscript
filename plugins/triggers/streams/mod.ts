/**
 * Browser-safe stream exports for the triggers plugin.
 *
 * @module
 */

export {
  createTriggersStreamDB,
  type TriggerEvent,
  type TriggersStreamCollections,
  type TriggersStreamDB,
  type TriggersStreamDBOptions,
} from './factory.ts';
export {
  TRIGGER_ACTION_KINDS,
  TRIGGER_BACKFILL_POLICIES,
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
  TRIGGER_RESERVED_KINDS,
  TRIGGER_RUNTIME_KINDS,
} from '@netscript/plugin-triggers-core/domain';
export { TriggerEventSchema, triggersStreamSchema } from './schema.ts';
export type {
  CronExpression,
  DeferAction,
  EnqueueJobAction,
  EnqueueJobOptions,
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchStabilityThreshold,
  FileWatchTriggerPayload,
  JobDefinition,
  JobId,
  ManualTriggerDefinition,
  ManualTriggerPayload,
  QueueTriggerDefinition,
  QueueTriggerPayload,
  RuntimeTriggerDefinition,
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  ScheduledTriggerSpec,
  StreamTriggerDefinition,
  StreamTriggerPayload,
  TriggerActionResult,
  TriggerBackfillPolicy,
  TriggerBackfillSpec,
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerContext,
  TriggerDeduplicationSpec,
  TriggerDefinition,
  TriggerDefinitionBase,
  TriggerDurabilityTier,
  TriggerEventId,
  TriggerEventStatus,
  TriggerHandler,
  TriggerId,
  TriggerKind,
  TriggerKnownKind,
  TriggerPayload,
  TriggerReservedKind,
  TriggerRetryPolicy,
  TriggerRuntimeKind,
  WebhookDefinition,
  WebhookId,
  WebhookTriggerPayload,
  WebhookVerifierKind,
} from '@netscript/plugin-triggers-core/domain';
export type {
  TriggerSchemaObject,
  TriggersStreamDefinition,
  TriggersStreamSchema,
  TriggerStreamCollectionHelpers,
  TriggerStreamEntity,
} from './schema.ts';
