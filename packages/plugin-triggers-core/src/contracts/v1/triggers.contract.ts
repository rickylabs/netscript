import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import {
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
} from '../../domain/mod.ts';

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

export const OffsetPaginationQuerySchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z
  .object(OffsetPaginationQueryShape);

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

export type TriggerDefinitionResponse = Readonly<{
  id: string;
  kind: (typeof TRIGGER_KINDS)[number];
  name?: string;
  description?: string;
  enabled: boolean;
  durabilityTier: (typeof TRIGGER_DURABILITY_TIERS)[number];
  entrypoint?: string;
  tags?: readonly string[];
}>;

export type TriggerEventResponse = Readonly<{
  id: string;
  triggerId: string;
  kind: (typeof TRIGGER_KINDS)[number];
  status: (typeof TRIGGER_EVENT_STATUSES)[number];
  attempt: number;
  detectedAt: string;
  updatedAt: string;
  idempotencyKey?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type TriggerFireInput = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
}>;

export type TriggerFireResponse = Readonly<{
  accepted: boolean;
  eventId: string;
  triggerId: string;
  status: 'pending' | 'deferred';
}>;

export type TriggerPreviewResponse = Readonly<{
  triggerId: string;
  nextFireAt: readonly string[];
  timezone?: string;
  persistent: boolean;
}>;

export type TriggerSSEEventType =
  | 'trigger:accepted'
  | 'trigger:started'
  | 'trigger:completed'
  | 'trigger:failed'
  | 'trigger:dlq'
  | 'heartbeat';

export type TriggerSSEEvent = Readonly<{
  type: TriggerSSEEventType;
  timestamp: string;
  triggerId?: string;
  eventId?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

type TriggerFilters = Readonly<{
  kind?: (typeof TRIGGER_KINDS)[number] | null;
  enabled?: boolean;
  tags?: string;
}>;

type EventFilters = Readonly<{
  triggerId?: string;
  kind?: (typeof TRIGGER_KINDS)[number] | null;
  status?: (typeof TRIGGER_EVENT_STATUSES)[number] | null;
}>;

export const TriggerDefinitionResponseSchema: z.ZodType<TriggerDefinitionResponse> = z.object({
  id: z.string(),
  kind: z.enum(TRIGGER_KINDS),
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean(),
  durabilityTier: z.enum(TRIGGER_DURABILITY_TIERS).default('t1'),
  entrypoint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const TriggerEventResponseSchema: z.ZodType<TriggerEventResponse> = z.object({
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

export const TriggerFireInputSchema: z.ZodType<TriggerFireInput> = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  reason: z.string().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

export const TriggerFireResponseSchema: z.ZodType<TriggerFireResponse> = z.object({
  accepted: z.boolean(),
  eventId: z.string(),
  triggerId: z.string(),
  status: z.enum(['pending', 'deferred']),
});

export const TriggerPreviewResponseSchema: z.ZodType<TriggerPreviewResponse> = z.object({
  triggerId: z.string(),
  nextFireAt: z.array(z.string().datetime()),
  timezone: z.string().optional(),
  persistent: z.boolean(),
});

export const TriggerSSEEventTypeSchema: z.ZodType<TriggerSSEEventType> = z.enum([
  'trigger:accepted',
  'trigger:started',
  'trigger:completed',
  'trigger:failed',
  'trigger:dlq',
  'heartbeat',
]);

export const TriggerSSEEventSchema: z.ZodType<TriggerSSEEvent> = z.object({
  type: TriggerSSEEventTypeSchema,
  timestamp: z.string().datetime(),
  triggerId: z.string().optional(),
  eventId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const TriggerFiltersShape: z.ZodRawShape = {
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

export const TriggerFiltersSchema: z.ZodType<TriggerFilters> = z.object(TriggerFiltersShape);

const EventFiltersShape: z.ZodRawShape = {
  triggerId: z.string().optional(),
  kind: z.enum(TRIGGER_KINDS).nullable().optional(),
  status: z.enum(TRIGGER_EVENT_STATUSES).nullable().optional(),
};

export const EventFiltersSchema: z.ZodType<EventFilters> = z.object(EventFiltersShape);

function createTriggersContractDefinition(): Parameters<typeof implement>[0] {
  return {
    listTriggers: baseContract
      .route({ method: 'GET', path: '/triggers' })
      .input(OffsetPaginationQuerySchema.extend(TriggerFiltersShape))
      .output(z.object({
        triggers: z.array(TriggerDefinitionResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getTrigger: baseContract
      .route({ method: 'GET', path: '/triggers/{id}' })
      .input(z.object({ id: z.string() }))
      .output(TriggerDefinitionResponseSchema),

    listEvents: baseContract
      .route({ method: 'GET', path: '/events' })
      .input(OffsetPaginationQuerySchema.extend(EventFiltersShape))
      .output(z.object({
        events: z.array(TriggerEventResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getEvent: baseContract
      .route({ method: 'GET', path: '/events/{id}' })
      .input(z.object({ id: z.string() }))
      .output(TriggerEventResponseSchema),

    fireTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/fire' })
      .input(z.object({ id: z.string(), body: TriggerFireInputSchema.optional() }))
      .output(TriggerFireResponseSchema),

    testWebhook: baseContract
      .route({ method: 'POST', path: '/webhooks/{id}/test' })
      .input(z.object({ id: z.string(), body: TriggerFireInputSchema.optional() }))
      .output(TriggerFireResponseSchema),

    previewSchedule: baseContract
      .route({ method: 'GET', path: '/triggers/{id}/preview' })
      .input(z.object({
        id: z.string(),
        count: z.coerce.number().int().min(1).max(50).default(5).optional(),
      }))
      .output(TriggerPreviewResponseSchema),

    enableTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/enable' })
      .input(z.object({ id: z.string() }))
      .output(TriggerDefinitionResponseSchema),

    disableTrigger: baseContract
      .route({ method: 'POST', path: '/triggers/{id}/disable' })
      .input(z.object({ id: z.string() }))
      .output(TriggerDefinitionResponseSchema),

    subscribeEvents: oc
      .route({ method: 'GET', path: '/events/subscribe' })
      .input(z.object(EventFiltersShape).optional())
      .output(eventIterator(TriggerSSEEventSchema)),
  } satisfies Parameters<typeof implement>[0];
}

type TriggersContractDefinition = ReturnType<typeof createTriggersContractDefinition>;

export const triggersContract: TriggersContractDefinition = createTriggersContractDefinition();
export const triggersContractV1: ReturnType<typeof implement> = implement(triggersContract);
