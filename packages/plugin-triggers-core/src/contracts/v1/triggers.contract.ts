import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import {
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
} from '../../domain/mod.ts';

/** Minimal schema contract exposed without leaking Zod internals. */
export type TriggerContractSchema<TOutput> = Readonly<{
  parse(data: unknown): TOutput;
  safeParse(data: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}>;

/** Trigger kinds represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_KINDS: readonly [
  'webhook',
  'file-watch',
  'scheduled',
  'queue',
  'stream',
  'manual',
] = TRIGGER_KINDS;

/** Durability tiers represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_DURABILITY_TIERS: readonly ['t1', 't2', 't3'] =
  TRIGGER_DURABILITY_TIERS;

/** Event statuses represented by the v1 trigger contract. */
export const TRIGGER_CONTRACT_EVENT_STATUSES: readonly [
  'pending',
  'in-flight',
  'deferred',
  'completed',
  'failed',
  'dlq',
] = TRIGGER_EVENT_STATUSES;

/** Trigger kind returned by v1 contract responses. */
export type TriggerContractKind = (typeof TRIGGER_CONTRACT_KINDS)[number];

/** Durability tier returned by v1 contract responses. */
export type TriggerContractDurabilityTier =
  (typeof TRIGGER_CONTRACT_DURABILITY_TIERS)[number];

/** Event status returned by v1 contract responses. */
export type TriggerContractEventStatus = (typeof TRIGGER_CONTRACT_EVENT_STATUSES)[number];

const nonNegativeInt = (description: string): z.ZodNumber =>
  z.number().int().nonnegative().describe(description);

const paginationLimit = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().min(1).max(1000).default(50).describe(description);

const paginationOffset = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().nonnegative().default(0).describe(description);

const OffsetPaginationQueryShape: z.ZodRawShape = {
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
};

/** Offset pagination query accepted by list endpoints. */
export type OffsetPaginationQuery = Readonly<{
  limit: number;
  offset: number;
}>;

const offsetPaginationQuerySchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z.object(
  OffsetPaginationQueryShape,
);

/** Offset pagination query schema accepted by list endpoints. */
export const OffsetPaginationQuerySchema: TriggerContractSchema<OffsetPaginationQuery> =
  offsetPaginationQuerySchema as unknown as TriggerContractSchema<OffsetPaginationQuery>;

const baseContract = oc.errors({
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: z.object({
      resourceType: z.string(),
      resourceId: z.union([z.string(), z.number()]),
    }),
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: z.object({
      formErrors: z.array(z.string()),
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    }),
  },
});

/** Trigger definition returned by v1 contract endpoints. */
export type TriggerDefinitionResponse = Readonly<{
  id: string;
  kind: TriggerContractKind;
  name?: string;
  description?: string;
  enabled: boolean;
  durabilityTier: TriggerContractDurabilityTier;
  entrypoint?: string;
  tags?: readonly string[];
}>;

/** Trigger event returned by v1 contract endpoints. */
export type TriggerEventResponse = Readonly<{
  id: string;
  triggerId: string;
  kind: TriggerContractKind;
  status: TriggerContractEventStatus;
  attempt: number;
  detectedAt: string;
  updatedAt: string;
  idempotencyKey?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Manual trigger fire request body. */
export type TriggerFireInput = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Manual trigger fire response body. */
export type TriggerFireResponse = Readonly<{
  accepted: boolean;
  eventId: string;
  triggerId: string;
  status: 'pending' | 'deferred';
}>;

/** Schedule preview response body. */
export type TriggerPreviewResponse = Readonly<{
  triggerId: string;
  nextFireAt: readonly string[];
  timezone?: string;
  persistent: boolean;
}>;

/** Server-sent event names emitted by trigger streams. */
export type TriggerSSEEventType =
  | 'trigger:accepted'
  | 'trigger:started'
  | 'trigger:completed'
  | 'trigger:failed'
  | 'trigger:dlq'
  | 'heartbeat';

/** Server-sent event payload emitted by trigger streams. */
export type TriggerSSEEvent = Readonly<{
  type: TriggerSSEEventType;
  timestamp: string;
  triggerId?: string;
  eventId?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Query filters accepted by trigger definition list endpoints. */
export type TriggerFilters = Readonly<{
  kind?: TriggerContractKind | null;
  enabled?: boolean;
  tags?: string;
}>;

/** Query filters accepted by trigger event list endpoints. */
export type EventFilters = Readonly<{
  triggerId?: string;
  kind?: TriggerContractKind | null;
  status?: TriggerContractEventStatus | null;
}>;

const triggerDefinitionResponseSchema: z.ZodType<TriggerDefinitionResponse> = z.object({
  id: z.string(),
  kind: z.enum(TRIGGER_KINDS),
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean(),
  durabilityTier: z.enum(TRIGGER_DURABILITY_TIERS).default('t1'),
  entrypoint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/** Trigger definition response schema. */
export const TriggerDefinitionResponseSchema: TriggerContractSchema<TriggerDefinitionResponse> =
  triggerDefinitionResponseSchema;

const triggerEventResponseSchema: z.ZodType<TriggerEventResponse> = z.object({
  id: z.string(),
  triggerId: z.string(),
  kind: z.enum(TRIGGER_KINDS),
  status: z.enum(TRIGGER_EVENT_STATUSES),
  attempt: z.number().int().nonnegative(),
  detectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Trigger event response schema. */
export const TriggerEventResponseSchema: TriggerContractSchema<TriggerEventResponse> =
  triggerEventResponseSchema;

const triggerFireInputSchema: z.ZodType<TriggerFireInput> = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  reason: z.string().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

/** Trigger fire request schema. */
export const TriggerFireInputSchema: TriggerContractSchema<TriggerFireInput> =
  triggerFireInputSchema;

const triggerFireResponseSchema: z.ZodType<TriggerFireResponse> = z.object({
  accepted: z.boolean(),
  eventId: z.string(),
  triggerId: z.string(),
  status: z.enum(['pending', 'deferred']),
});

/** Trigger fire response schema. */
export const TriggerFireResponseSchema: TriggerContractSchema<TriggerFireResponse> =
  triggerFireResponseSchema;

const triggerPreviewResponseSchema: z.ZodType<TriggerPreviewResponse> = z.object({
  triggerId: z.string(),
  nextFireAt: z.array(z.string().datetime()),
  timezone: z.string().optional(),
  persistent: z.boolean(),
});

/** Trigger schedule preview response schema. */
export const TriggerPreviewResponseSchema: TriggerContractSchema<TriggerPreviewResponse> =
  triggerPreviewResponseSchema;

const triggerSSEEventTypeSchema: z.ZodType<TriggerSSEEventType> = z.enum([
  'trigger:accepted',
  'trigger:started',
  'trigger:completed',
  'trigger:failed',
  'trigger:dlq',
  'heartbeat',
]);

/** Trigger SSE event type schema. */
export const TriggerSSEEventTypeSchema: TriggerContractSchema<TriggerSSEEventType> =
  triggerSSEEventTypeSchema;

const triggerSSEEventSchema: z.ZodType<TriggerSSEEvent> = z.object({
  type: triggerSSEEventTypeSchema,
  timestamp: z.string().datetime(),
  triggerId: z.string().optional(),
  eventId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Trigger SSE event schema. */
export const TriggerSSEEventSchema: TriggerContractSchema<TriggerSSEEvent> =
  triggerSSEEventSchema;

const TriggerFiltersShape: z.ZodRawShape = {
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

const triggerFiltersSchema: z.ZodType<TriggerFilters> = z.object(TriggerFiltersShape);

/** Trigger list filter schema. */
export const TriggerFiltersSchema: TriggerContractSchema<TriggerFilters> = triggerFiltersSchema;

const EventFiltersShape: z.ZodRawShape = {
  triggerId: z.string().optional(),
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  status: z.enum(TRIGGER_EVENT_STATUSES).nullable().optional(),
};

const eventFiltersSchema: z.ZodType<EventFilters> = z.object(EventFiltersShape);

/** Trigger event list filter schema. */
export const EventFiltersSchema: TriggerContractSchema<EventFilters> = eventFiltersSchema;

function createTriggersContractDefinition(): Parameters<typeof implement>[0] {
  return {
    listTriggers: baseContract
      .route({ method: 'GET', path: '/triggers' })
      .input(offsetPaginationQuerySchema.extend(TriggerFiltersShape))
      .output(z.object({
        triggers: z.array(triggerDefinitionResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getTrigger: baseContract
      .route({ method: 'GET', path: '/triggers/{id}' })
      .input(z.object({ id: z.string() }))
      .output(triggerDefinitionResponseSchema),

    listEvents: baseContract
      .route({ method: 'GET', path: '/events' })
      .input(offsetPaginationQuerySchema.extend(EventFiltersShape))
      .output(z.object({
        events: z.array(triggerEventResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getEvent: baseContract
      .route({ method: 'GET', path: '/events/{id}' })
      .input(z.object({ id: z.string() }))
      .output(triggerEventResponseSchema),

    fireTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/fire' })
      .input(z.object({ id: z.string(), body: triggerFireInputSchema.optional() }))
      .output(triggerFireResponseSchema),

    testWebhook: baseContract
      .route({ method: 'POST', path: '/webhooks/{id}/test' })
      .input(z.object({ id: z.string(), body: triggerFireInputSchema.optional() }))
      .output(triggerFireResponseSchema),

    previewSchedule: baseContract
      .route({ method: 'GET', path: '/triggers/{id}/preview' })
      .input(z.object({
        id: z.string(),
        count: z.coerce.number().int().min(1).max(50).default(5).optional(),
      }))
      .output(triggerPreviewResponseSchema),

    enableTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/enable' })
      .input(z.object({ id: z.string() }))
      .output(triggerDefinitionResponseSchema),

    disableTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/disable' })
      .input(z.object({ id: z.string() }))
      .output(triggerDefinitionResponseSchema),

    subscribeEvents: oc
      .route({ method: 'GET', path: '/events/subscribe' })
      .input(z.object(EventFiltersShape).optional())
      .output(eventIterator(triggerSSEEventSchema)),
  } satisfies Parameters<typeof implement>[0];
}

type TriggersContractDefinition = ReturnType<typeof createTriggersContractDefinition>;

const triggersContractDefinition: TriggersContractDefinition = createTriggersContractDefinition();

/** v1 trigger oRPC contract definition. */
export const triggersContract: Readonly<Record<string, unknown>> =
  triggersContractDefinition as unknown as Readonly<Record<string, unknown>>;

/** v1 trigger oRPC implementation builder. */
export const triggersContractV1: unknown = implement(triggersContractDefinition);
