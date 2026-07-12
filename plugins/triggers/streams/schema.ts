/**
 * Durable stream schema for trigger events.
 *
 * @module
 */

import { z } from 'zod';
import { defineStreamSchema } from '@netscript/plugin-streams-core';
import { TRIGGER_EVENT_STATUSES, type TriggerEvent } from '@netscript/plugin-triggers-core/domain';

/** Parser surface exposed by trigger stream schema objects. */
export type TriggerSchemaObject<TOutput = unknown> = Readonly<{
  parse(input: unknown): TOutput;
  safeParse(input: unknown): unknown;
}>;

/** Zod schema for a trigger event stream envelope. */
export const TriggerEventSchema: TriggerSchemaObject<TriggerEvent> = z.object({
  id: z.string(),
  triggerId: z.string(),
  kind: z.string(),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  payload: z.unknown(),
  attempt: z.number().int().nonnegative(),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}) as unknown as TriggerSchemaObject<TriggerEvent>; // quality-allow: durable-stream schema generics are invariant across the generated trigger entity map

/** Zod schema for the durable stream trigger event entity. */
export const TriggerStreamEntitySchema: TriggerSchemaObject<TriggerStreamEntity> = z.object({
  eventId: z.string(),
  triggerId: z.string(),
  kind: z.string(),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  detectedAt: z.string(),
  updatedAt: z.string(),
  payload: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}) as unknown as TriggerSchemaObject<TriggerStreamEntity>; // quality-allow: durable-stream schema generics are invariant across the generated trigger entity map

/** Durable stream entity stored for one trigger event. */
export type TriggerStreamEntity = Readonly<{
  eventId: string;
  triggerId: string;
  kind: string;
  status: string;
  detectedAt: string;
  updatedAt: string;
  payload: unknown;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Durable stream state definition for trigger event entities. */
export type TriggersStreamDefinition = Readonly<{
  triggerEvent: {
    readonly schema: TriggerSchemaObject<TriggerStreamEntity>;
    readonly type: 'triggerEvent';
    readonly primaryKey: 'eventId';
  };
}>;

/** Helper methods attached to trigger stream collections. */
export type TriggerStreamCollectionHelpers = Readonly<{
  insert(value: TriggerStreamEntity): unknown;
  update(value: TriggerStreamEntity): unknown;
  upsert(value: TriggerStreamEntity): unknown;
  delete(key: string): unknown;
}>;

/** Entity-based durable stream schema surface for trigger events. */
export type TriggersStreamSchema = Readonly<{
  triggerEvent: TriggersStreamDefinition['triggerEvent'] & TriggerStreamCollectionHelpers;
}>;

/** Entity-based durable stream schema for trigger events. */
export const triggersStreamSchema: TriggersStreamSchema = defineStreamSchema({
  triggerEvent: {
    schema: TriggerStreamEntitySchema,
    type: 'triggerEvent',
    primaryKey: 'eventId',
  },
}) as unknown as TriggersStreamSchema; // quality-allow: durable-stream schema generics are invariant across the generated trigger entity map

export type { TriggerEvent };
