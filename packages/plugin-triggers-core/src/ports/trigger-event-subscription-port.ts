import type { TriggerEvent, TriggerEventStatus, TriggerKind } from '../domain/mod.ts';

/** Trigger lifecycle event emitted to live subscribers. */
export type TriggerEventSubscriptionType =
  | 'trigger:accepted'
  | 'trigger:started'
  | 'trigger:completed'
  | 'trigger:failed'
  | 'trigger:dlq';

/** Subscription filter for live trigger event streams. */
export type TriggerEventSubscriptionFilter = Readonly<{
  triggerId?: string;
  kind?: TriggerKind;
  status?: TriggerEventStatus;
}>;

/** Subscribe options for live trigger event streams. */
export type TriggerEventSubscriptionOptions = Readonly<{
  signal?: AbortSignal;
}>;

/** Message yielded by trigger event subscription ports. */
export type TriggerEventSubscriptionMessage = Readonly<{
  type: TriggerEventSubscriptionType;
  timestamp: string;
  event: TriggerEvent;
}>;

/** In-process live trigger event subscription boundary. */
export interface TriggerEventSubscriptionPort {
  /** Subscribe to future lifecycle messages matching an optional filter. */
  subscribe(
    filter?: TriggerEventSubscriptionFilter,
    options?: TriggerEventSubscriptionOptions,
  ): AsyncIterable<TriggerEventSubscriptionMessage>;

  /** Publish one lifecycle message to current subscribers. */
  publish(message: TriggerEventSubscriptionMessage): Promise<void>;
}
