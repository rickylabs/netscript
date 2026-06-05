import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../../domain/mod.ts';

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

export type SagaDefinitionResponse = Readonly<{
  id: string;
  name: string;
  description?: string;
  topic: string;
  enabled: boolean;
  entrypoint: string;
  tags?: readonly string[];
  durabilityTier: (typeof SAGA_DURABILITY_TIERS)[number];
  timeout?: Readonly<{
    completionTimeout?: number;
  }>;
  retry?: Readonly<{
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  }>;
}>;

export type SagaInstanceResponse = Readonly<{
  sagaName: string;
  sagaId?: string;
  instanceId?: string;
  correlationId: string;
  correlationKey?: string;
  state: Readonly<Record<string, unknown>>;
  status: (typeof SAGA_INSTANCE_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number;
  messageCount: number;
  lastMessageType?: string;
}>;

export type PublishMessageInput = Readonly<{
  type: string;
  payload?: Readonly<Record<string, unknown>>;
  correlationId?: string;
  correlationKey?: string;
  idempotencyKey?: string;
  concurrencyKey?: string;
  topic?: string;
  traceparent?: string;
  tracestate?: string;
}>;

export type PublishMessageResponse = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
  correlationKey?: string;
  messageId?: string;
}>;

export type SagaSSEEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';

export type SagaSSEEvent = Readonly<{
  type: SagaSSEEventType;
  timestamp: string;
  sagaName?: string;
  sagaId?: string;
  instanceId?: string;
  correlationId?: string;
  correlationKey?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

type SagaFilters = Readonly<{
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

type InstanceFilters = Readonly<{
  sagaName?: string;
  sagaId?: string;
  status?: (typeof SAGA_INSTANCE_STATUSES)[number] | null;
  topic?: string;
}>;

export type SagaHistoryEntry = Readonly<{
  id: string;
  sagaName: string;
  sagaId: string;
  instanceId?: string;
  correlationId: string;
  correlationKey?: string;
  messageType: string;
  messageId?: string;
  previousState?: Readonly<Record<string, unknown>>;
  newState: Readonly<Record<string, unknown>>;
  outcome: 'success' | 'error' | 'compensated';
  error?: string;
  duration?: number;
  transitionAt: string;
}>;

export const SagaDefinitionResponseSchema: z.ZodType<SagaDefinitionResponse> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  topic: z.string(),
  enabled: z.boolean(),
  entrypoint: z.string(),
  tags: z.array(z.string()).optional(),
  durabilityTier: z.enum(SAGA_DURABILITY_TIERS).default('t1'),
  timeout: z.object({
    completionTimeout: z.number().int().positive().optional(),
  }).optional(),
  retry: z.object({
    maxAttempts: z.number().int().nonnegative().optional(),
    initialDelay: z.number().int().nonnegative().optional(),
    maxDelay: z.number().int().nonnegative().optional(),
  }).optional(),
});

export const SagaInstanceResponseSchema: z.ZodType<SagaInstanceResponse> = z.object({
  sagaName: z.string(),
  sagaId: z.string().optional(),
  instanceId: z.string().optional(),
  correlationId: z.string(),
  correlationKey: z.string().optional(),
  state: z.record(z.string(), z.unknown()),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  version: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  lastMessageType: z.string().optional(),
});

export const PublishMessageInputSchema: z.ZodType<PublishMessageInput> = z.object({
  type: z.string().min(1).describe('Message type identifier'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Message payload'),
  correlationId: z.string().optional().describe('Compatibility correlation identifier'),
  correlationKey: z.string().optional().describe('Saga correlation key'),
  idempotencyKey: z.string().optional().describe('Idempotency key for T1 deduplication'),
  concurrencyKey: z.string().optional().describe('Concurrency key for runtime throttling'),
  topic: z.string().optional().describe('Topic override'),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

export const PublishMessageResponseSchema: z.ZodType<PublishMessageResponse> = z.object({
  published: z.boolean(),
  messageType: z.string(),
  correlationId: z.string().optional(),
  correlationKey: z.string().optional(),
  messageId: z.string().optional(),
});

export const SagaSSEEventTypeSchema: z.ZodType<SagaSSEEventType> = z.enum([
  'saga:started',
  'saga:message_received',
  'saga:state_changed',
  'saga:completed',
  'saga:failed',
  'saga:compensating',
  'heartbeat',
]);

export const SagaSSEEventSchema: z.ZodType<SagaSSEEvent> = z.object({
  type: SagaSSEEventTypeSchema,
  timestamp: z.string().datetime(),
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  instanceId: z.string().optional(),
  correlationId: z.string().optional(),
  correlationKey: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const SagaFiltersShape: z.ZodRawShape = {
  topic: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

export const SagaFiltersSchema: z.ZodType<SagaFilters> = z.object(SagaFiltersShape);

const InstanceFiltersShape: z.ZodRawShape = {
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  status: z.enum(SAGA_INSTANCE_STATUSES).nullable().optional(),
  topic: z.string().optional(),
};

export const InstanceFiltersSchema: z.ZodType<InstanceFilters> = z.object(InstanceFiltersShape);

export const SagaHistoryEntrySchema: z.ZodType<SagaHistoryEntry> = z.object({
  id: z.string(),
  sagaName: z.string(),
  sagaId: z.string(),
  instanceId: z.string().optional(),
  correlationId: z.string(),
  correlationKey: z.string().optional(),
  messageType: z.string(),
  messageId: z.string().optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()),
  outcome: z.enum(['success', 'error', 'compensated']),
  error: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  transitionAt: z.string().datetime(),
});

function createSagasContractDefinition(): Parameters<typeof implement>[0] {
  return {
    listSagas: baseContract
      .route({ method: 'GET', path: '/sagas' })
      .input(OffsetPaginationQuerySchema.extend(SagaFiltersShape))
      .output(z.object({
        sagas: z.array(SagaDefinitionResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getSaga: baseContract
      .route({ method: 'GET', path: '/sagas/{id}' })
      .input(z.object({ id: z.string() }))
      .output(SagaDefinitionResponseSchema),

    listInstances: baseContract
      .route({ method: 'GET', path: '/instances' })
      .input(OffsetPaginationQuerySchema.extend(InstanceFiltersShape))
      .output(z.object({
        instances: z.array(SagaInstanceResponseSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getInstance: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}' })
      .input(z.object({ sagaName: z.string(), correlationId: z.string() }))
      .output(SagaInstanceResponseSchema),

    getInstanceHistory: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}/history' })
      .input(z.object({
        sagaName: z.string(),
        correlationId: z.string(),
        limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
        offset: z.coerce.number().int().nonnegative().default(0).optional(),
      }))
      .output(z.object({
        history: z.array(SagaHistoryEntrySchema),
        total: nonNegativeInt('Total count'),
      })),

    publish: baseContract
      .route({ method: 'POST', path: '/publish' })
      .input(PublishMessageInputSchema)
      .output(PublishMessageResponseSchema),

    subscribe: oc
      .route({ method: 'GET', path: '/subscribe' })
      .input(
        z.object({
          sagaName: z.string().optional(),
          sagaId: z.string().optional(),
          topic: z.string().optional(),
          streaming: z.coerce.boolean().optional(),
        }).optional(),
      )
      .output(eventIterator(SagaSSEEventSchema)),
  } satisfies Parameters<typeof implement>[0];
}

type SagasContractDefinition = ReturnType<typeof createSagasContractDefinition>;

export const sagasContract: SagasContractDefinition = createSagasContractDefinition();
export const sagasContractV1: ReturnType<typeof implement> = implement(sagasContract);
