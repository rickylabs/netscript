import type { TriggerDurabilityTier, TriggerKind } from './constants.ts';
import type { ScheduledTriggerSpec } from './scheduled-spec.ts';
import type { TriggerActionResult } from './trigger-action.ts';
import type { TriggerId, WebhookId } from './ids.ts';
import type {
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerDeduplicationSpec,
  TriggerRetryPolicy,
} from './trigger-spec.ts';

/** Handler invoked by the processor for a trigger event. */
export type TriggerHandler<TEvent = unknown, TContext = unknown> = (
  event: TEvent,
  context: TContext,
) => Promise<readonly TriggerActionResult[]>;

/** Common immutable fields shared by trigger definitions. */
export type TriggerDefinitionBase<
  TKind extends TriggerKind,
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> = Readonly<{
  id: TriggerId<TId>;
  kind: TKind;
  name?: string;
  enabled?: boolean;
  durability: TriggerDurabilityTier;
  handler: TriggerHandler<TEvent, TContext>;
  retry?: TriggerRetryPolicy;
  concurrency?: TriggerConcurrencySpec;
  circuitBreaker?: TriggerCircuitBreakerSpec;
  deduplication?: TriggerDeduplicationSpec;
  description?: string;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Webhook verifier selector declared by a webhook trigger. */
export type WebhookVerifierKind = 'hmac-sha256' | 'memory' | (string & Record<never, never>);

/** Webhook trigger definition discovered by the runtime walker. */
export type WebhookDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'webhook', TId, TEvent, TContext>
  & Readonly<{
    webhookId: WebhookId<TId>;
    path: string;
    verifier: WebhookVerifierKind;
    secretEnv?: string;
  }>;

/** File lifecycle event names supported by file-watch triggers. */
export type FileWatchLifecycle = 'create' | 'modify' | 'remove';

/** File-watch trigger definition discovered by the runtime walker. */
export type FileWatchDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'file-watch', TId, TEvent, TContext>
  & Readonly<{
    paths: readonly string[];
    patterns: readonly string[];
    ignored?: readonly string[];
    on: readonly FileWatchLifecycle[];
    debounceMs?: number;
    stabilityThreshold?: FileWatchStabilityThreshold;
  }>;

/** Stability threshold for network-filesystem tolerant file-watch triggers. */
export type FileWatchStabilityThreshold = Readonly<{
  checkIntervalMs: number;
  stableChecks: number;
}>;

/** Scheduled trigger definition discovered by the runtime walker. */
export type ScheduledTriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'scheduled', TId, TEvent, TContext>
  & ScheduledTriggerSpec;

/** Reserved queue-source trigger definition. Runtime execution is deferred. */
export type QueueTriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'queue', TId, TEvent, TContext>
  & Readonly<{
    queue: string;
    consumerGroup?: string;
  }>;

/** Reserved stream-source trigger definition. Runtime execution is deferred. */
export type StreamTriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'stream', TId, TEvent, TContext>
  & Readonly<{
    topic: string;
    consumerGroup?: string;
  }>;

/** Reserved manual trigger definition for CLI/API fire paths. */
export type ManualTriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  & TriggerDefinitionBase<'manual', TId, TEvent, TContext>
  & Readonly<{
    auditRequired: boolean;
  }>;

/** Trigger definitions implemented by the Group F runtime. */
export type RuntimeTriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  | WebhookDefinition<TId, TEvent, TContext>
  | FileWatchDefinition<TId, TEvent, TContext>
  | ScheduledTriggerDefinition<TId, TEvent, TContext>;

/** Trigger definitions known by the Group F public surface. */
export type TriggerDefinition<
  TId extends string = string,
  TEvent = unknown,
  TContext = unknown,
> =
  | RuntimeTriggerDefinition<TId, TEvent, TContext>
  | QueueTriggerDefinition<TId, TEvent, TContext>
  | StreamTriggerDefinition<TId, TEvent, TContext>
  | ManualTriggerDefinition<TId, TEvent, TContext>;
