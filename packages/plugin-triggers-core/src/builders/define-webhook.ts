import type { JobDefinition } from '@netscript/plugin-workers-core';
import {
  DEFAULT_TRIGGER_DURABILITY_TIER,
  type EnqueueJobAction,
  type EnqueueJobOptions,
  type TriggerContext,
  type TriggerEvent,
  type TriggerHandler,
  type TriggerId,
  TriggersError,
  type WebhookDefinition,
  type WebhookId,
  type WebhookTriggerPayload,
  type WebhookVerifierKind,
} from '../domain/mod.ts';

/** Webhook handler signature used by `defineWebhook`. */
export type WebhookHandler<TPayload = unknown> = TriggerHandler<
  TriggerEvent<'webhook', WebhookTriggerPayload<TPayload>>,
  TriggerContext
>;

/** Webhook definition fields accepted by `defineWebhook`. */
export type WebhookSpec<TId extends string = string> = Readonly<{
  id: TId;
  path: string;
  verifier: WebhookVerifierKind;
  secretEnv?: string;
  name?: string;
  enabled?: boolean;
  description?: string;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

/**
 * Define a webhook trigger from a handler and static spec.
 *
 * @param handler - Handler invoked after ingress verifies and persists the event.
 * @param spec - Static webhook trigger metadata discovered by the walker.
 * @returns Frozen webhook trigger definition.
 */
export function defineWebhook<TId extends string, TPayload = unknown>(
  handler: WebhookHandler<TPayload>,
  spec: WebhookSpec<TId>,
): WebhookDefinition<
  TId,
  TriggerEvent<'webhook', WebhookTriggerPayload<TPayload>>,
  TriggerContext
> {
  assertNonEmpty(spec.id, 'Webhook trigger id is required.');
  assertNonEmpty(spec.path, 'Webhook trigger path is required.');
  assertNonEmpty(spec.verifier, 'Webhook verifier is required.');

  return Object.freeze({
    id: spec.id as TriggerId<TId>,
    webhookId: spec.id as WebhookId<TId>,
    kind: 'webhook',
    name: spec.name,
    enabled: spec.enabled,
    durability: DEFAULT_TRIGGER_DURABILITY_TIER,
    handler,
    path: spec.path,
    verifier: spec.verifier,
    secretEnv: spec.secretEnv,
    description: spec.description,
    tags: spec.tags ? Object.freeze([...spec.tags]) : undefined,
    metadata: spec.metadata ? Object.freeze({ ...spec.metadata }) : undefined,
  });
}

/**
 * Create an action that enqueues a typed worker job from a trigger handler.
 *
 * @param job - Worker job definition imported from `@netscript/plugin-workers-core`.
 * @param options - Optional idempotency, concurrency, priority, and payload options.
 * @returns Frozen enqueue-job action for the trigger processor.
 */
export function enqueueJob<TJobId extends string, TPayload = unknown>(
  job: JobDefinition<TJobId>,
  options: EnqueueJobOptions<TPayload> = {},
): EnqueueJobAction<TJobId, TPayload> {
  return Object.freeze({
    kind: 'enqueue-job',
    job,
    jobId: job.id,
    options: Object.freeze({ ...options }),
  });
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw TriggersError.validationFailed(message);
  }
}
