/**
 * Durable stream schema for trigger events.
 *
 * @module
 */

import { z } from 'zod';
import {
  type CollectionEventHelpers,
  defineStreamSchema,
  type StateSchema,
} from '@netscript/plugin-streams-core';
import {
  TRIGGER_EVENT_STATUSES,
  type TriggerEvent,
  type TriggerKind,
} from '@netscript/plugin-triggers-core/domain';

/** Wire-safe trigger event parsed from the stream before domain ID branding. */
export type TriggerStreamEvent =
  & Omit<
    TriggerEvent<TriggerKind, unknown>,
    'id' | 'triggerId'
  >
  & Readonly<{ id: string; triggerId: string }>;

/** Package-owned Standard Schema parser surface for trigger stream entities. */
export interface TriggerSchemaObject<TOutput = unknown> {
  /** Standard Schema metadata and validator consumed by durable-streams. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    validate(value: unknown):
      | { readonly value: TOutput }
      | { readonly issues: readonly { readonly message: string }[] }
      | Promise<
        | { readonly value: TOutput }
        | { readonly issues: readonly { readonly message: string }[] }
      >;
  };
  /** Parse an input or throw a schema error. */
  parse(input: unknown): TOutput;
  /** Parse an input and return a discriminated result. */
  safeParse(input: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}

/** Zod schema for a trigger event stream envelope. */
export const TriggerEventSchema: TriggerSchemaObject<TriggerStreamEvent> = z.object({
  id: z.string(),
  triggerId: z.string(),
  kind: z.string(),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  payload: z.unknown(),
  attempt: z.number().int().nonnegative(),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  requestHeaders: z.record(z.string(), z.string()).optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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
});

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
    readonly schema: typeof TriggerStreamEntitySchema;
    readonly type: 'triggerEvent';
    readonly primaryKey: 'eventId';
  };
}>;

/** Entity-based durable stream schema surface for trigger events. */
export type TriggersStreamSchema = StateSchema<TriggersStreamDefinition>;

/** Helper methods attached to trigger stream collections. */
export type TriggerStreamCollectionHelpers = CollectionEventHelpers<TriggerStreamEntity>;

/** Entity-based durable stream schema for trigger events. */
export const triggersStreamSchema: TriggersStreamSchema = defineStreamSchema<
  TriggersStreamDefinition
>({
  triggerEvent: {
    schema: TriggerStreamEntitySchema,
    type: 'triggerEvent',
    primaryKey: 'eventId',
  },
});

export type { TriggerEvent };
