/**
 * Durable stream schema for trigger events.
 *
 * @module
 */

import { z } from 'zod';
import { defineStreamSchema, type StateSchema } from '@netscript/plugin-streams-core';
import { TRIGGER_EVENT_STATUSES, type TriggerEvent } from '@netscript/plugin-triggers-core/domain';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;

/** Zod schema for a trigger event stream envelope. */
export const TriggerEventSchema: AnyZodObject = z.object({
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
});

/** Zod schema for the durable stream trigger event entity. */
export const TriggerStreamEntitySchema: AnyZodObject = z.object({
  eventId: z.string(),
  triggerId: z.string(),
  kind: z.string(),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  detectedAt: z.string(),
  updatedAt: z.string(),
  payload: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TriggerStreamEntity = z.infer<typeof TriggerStreamEntitySchema>;

type TriggersStreamDefinition = Readonly<{
  triggerEvent: {
    readonly schema: typeof TriggerStreamEntitySchema;
    readonly type: 'triggerEvent';
    readonly primaryKey: 'eventId';
  };
}>;

/** Entity-based durable stream schema for trigger events. */
export const triggersStreamSchema: StateSchema<TriggersStreamDefinition> = defineStreamSchema({
  triggerEvent: {
    schema: TriggerStreamEntitySchema,
    type: 'triggerEvent',
    primaryKey: 'eventId',
  },
});

export type { TriggerEvent };
