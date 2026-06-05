import type { TriggerEventStatus, TriggerKind } from './constants.ts';
import type { TriggerEventId, TriggerId } from './ids.ts';
import type { FileWatchLifecycle } from './trigger-definition.ts';

/** HTTP payload captured by webhook ingress before processing. */
export type WebhookTriggerPayload<TBody = unknown> = Readonly<{
  body: TBody;
  headers: Readonly<Record<string, string>>;
  method: 'POST';
  path: string;
  remoteAddr?: string;
}>;

/** Filesystem payload captured by a file-watch adapter. */
export type FileWatchTriggerPayload = Readonly<{
  path: string;
  kind: FileWatchLifecycle;
  size?: number;
  modifiedAt?: string;
  stableChecks?: number;
}>;

/** Scheduled payload emitted by a scheduler adapter. */
export type ScheduledTriggerPayload = Readonly<{
  scheduledAt: string;
  firedAt: string;
  cron: string;
  timezone?: string;
  missedFireAt?: string;
}>;

/** Reserved queue-source payload. Runtime execution is deferred. */
export type QueueTriggerPayload<TMessage = unknown> = Readonly<{
  queue: string;
  messageId: string;
  message: TMessage;
  receivedAt: string;
}>;

/** Reserved stream-source payload. Runtime execution is deferred. */
export type StreamTriggerPayload<TMessage = unknown> = Readonly<{
  topic: string;
  message: TMessage;
  offset?: string;
  partitionKey?: string;
  receivedAt: string;
}>;

/** Reserved manual-fire payload for CLI and API dispatch. */
export type ManualTriggerPayload<TPayload = unknown> = Readonly<{
  payload: TPayload;
  firedBy?: string;
  reason?: string;
  firedAt: string;
}>;

/** Payload union for known Group F trigger kinds. */
export type TriggerPayload =
  | WebhookTriggerPayload
  | FileWatchTriggerPayload
  | ScheduledTriggerPayload
  | QueueTriggerPayload
  | StreamTriggerPayload
  | ManualTriggerPayload;

/** Unified event envelope consumed by every trigger processor path. */
export type TriggerEvent<
  TKind extends TriggerKind = TriggerKind,
  TPayload = TriggerPayload,
> = Readonly<{
  id: TriggerEventId;
  triggerId: TriggerId;
  kind: TKind;
  status: TriggerEventStatus;
  payload: TPayload;
  attempt: number;
  detectedAt: string;
  updatedAt: string;
  idempotencyKey?: string;
  requestHeaders?: Readonly<Record<string, string>>;
  traceparent?: string;
  tracestate?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;
