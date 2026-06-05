/**
 * Durable stream producer helpers for trigger events.
 *
 * @module
 */

import { createDurableStream, type DurableStreamProducer } from '@netscript/plugin-streams-core';
import type { TriggerEvent } from '@netscript/plugin-triggers-core/domain';
import { triggersStreamSchema, type TriggerStreamEntity } from './schema.ts';

const STREAM_PATH = '/triggers/events';
const PRODUCER_ID = 'triggers-service';

export type TriggersStreamProducer = DurableStreamProducer<typeof triggersStreamSchema>;

export type TriggerStreamMutation = Readonly<{
  type: 'save' | 'update-status';
  triggerEvent: TriggerEvent;
}>;

export function createTriggersStreamProducer(): TriggersStreamProducer {
  return createDurableStream({
    streamPath: STREAM_PATH,
    schema: triggersStreamSchema,
    producerId: PRODUCER_ID,
  });
}

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

export function publishTriggerEvent(
  producer: TriggersStreamProducer,
  event: TriggerEvent,
): void {
  producer.upsert('triggerEvent', toTriggerStreamEntity(event));
}

export function createStreamMutationHook(
  producer: TriggersStreamProducer,
): (mutation: TriggerStreamMutation) => void {
  return ({ triggerEvent }) => publishTriggerEvent(producer, triggerEvent);
}
