/**
 * Durable stream producer helpers for trigger events.
 *
 * @module
 */

import { createDurableStream } from '@netscript/plugin-streams-core';
import type { TriggerEvent } from '@netscript/plugin-triggers-core/domain';
import { triggersStreamSchema, type TriggerStreamEntity } from './schema.ts';

const STREAM_PATH = '/triggers/events';
const PRODUCER_ID = 'triggers-service';

/** Durable stream producer surface used by the triggers service. */
export type TriggersStreamProducer = Readonly<{
  streamPath: string;
  closed: boolean;
  upsert(entityType: 'triggerEvent', value: TriggerStreamEntity): void;
  delete(entityType: 'triggerEvent', key: string): void;
  flush(): Promise<void>;
  close(): Promise<void>;
}>;

/** Mutation payload emitted from trigger runtime stores into the durable stream. */
export type TriggerStreamMutation = Readonly<{
  type: 'save' | 'update-status';
  triggerEvent: TriggerEvent;
}>;

/** Create the durable stream producer for trigger events. */
export function createTriggersStreamProducer(): TriggersStreamProducer {
  return createDurableStream({
    streamPath: STREAM_PATH,
    schema: triggersStreamSchema as never,
    producerId: PRODUCER_ID,
  }) as TriggersStreamProducer;
}

/** Convert a trigger event envelope to the durable stream entity shape. */
export function toTriggerStreamEntity(event: TriggerEvent): TriggerStreamEntity {
  return {
    eventId: event.id,
    triggerId: event.triggerId,
    kind: event.kind,
    status: event.status,
    detectedAt: event.detectedAt,
    updatedAt: event.updatedAt,
    payload: event.payload,
    metadata: event.metadata,
  };
}

/** Publish a trigger event entity to the durable stream. */
export function publishTriggerEvent(
  producer: TriggersStreamProducer,
  event: TriggerEvent,
): void {
  producer.upsert('triggerEvent', toTriggerStreamEntity(event));
}

/** Create a hook that publishes trigger store mutations to the durable stream. */
export function createStreamMutationHook(
  producer: TriggersStreamProducer,
): (mutation: TriggerStreamMutation) => void {
  return ({ triggerEvent }) => publishTriggerEvent(producer, triggerEvent);
}
