import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../../domain/mod.ts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for saga contracts. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ContractSchemaResult<TOutput>;
}

/** Structural Standard Schema reference used by contract metadata. */
export type StandardSchemaLike<TInput = unknown, TOutput = TInput> = Readonly<{
  '~standard': Readonly<{
    types?: Readonly<{
      input: TInput;
      output: TOutput;
    }>;
  }>;
}>;

/** Structural oRPC procedure reference used by saga contracts. */
export type ContractProcedureLike<TInput = unknown, TOutput = unknown> = Readonly<{
  '~orpc': Readonly<{
    inputSchema?: StandardSchemaLike<TInput>;
    outputSchema?: StandardSchemaLike<unknown, TOutput>;
  }>;
}>;

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

const OffsetPaginationQueryZodSchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z
  .object(OffsetPaginationQueryShape);

/** Offset pagination query schema shared by list endpoints. */
export const OffsetPaginationQuerySchema: ContractSchema = OffsetPaginationQueryZodSchema;

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

/** Public response returned for a configured saga definition. */
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

/** Public response returned for a persisted saga instance. */
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

/** Input accepted by the publish endpoint. */
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

/** Response returned after a saga message publish attempt. */
export type PublishMessageResponse = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
  correlationKey?: string;
  messageId?: string;
}>;

/** Server-sent event kinds emitted by the saga service. */
export type SagaSSEEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';

/** Server-sent event payload emitted by saga subscriptions. */
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

/** Query filters accepted by the list-sagas endpoint. */
export type SagaFilters = Readonly<{
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

/** Query filters accepted by the list-instances endpoint. */
export type InstanceFilters = Readonly<{
  sagaName?: string;
  sagaId?: string;
  status?: (typeof SAGA_INSTANCE_STATUSES)[number] | null;
  topic?: string;
}>;

/** Public history entry returned for saga state transitions. */
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

const SagaDefinitionResponseZodSchema: z.ZodType<SagaDefinitionResponse> = z.object({
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

/** Schema for saga definition responses. */
export const SagaDefinitionResponseSchema: ContractSchema<SagaDefinitionResponse> =
  SagaDefinitionResponseZodSchema;

const SagaInstanceResponseZodSchema: z.ZodType<SagaInstanceResponse> = z.object({
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

/** Schema for saga instance responses. */
export const SagaInstanceResponseSchema: ContractSchema<SagaInstanceResponse> =
  SagaInstanceResponseZodSchema;

const PublishMessageInputZodSchema: z.ZodType<PublishMessageInput> = z.object({
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

/** Schema for publish endpoint input. */
export const PublishMessageInputSchema: ContractSchema<PublishMessageInput> =
  PublishMessageInputZodSchema;

const PublishMessageResponseZodSchema: z.ZodType<PublishMessageResponse> = z.object({
  published: z.boolean(),
  messageType: z.string(),
  correlationId: z.string().optional(),
  correlationKey: z.string().optional(),
  messageId: z.string().optional(),
});

/** Schema for publish endpoint responses. */
export const PublishMessageResponseSchema: ContractSchema<PublishMessageResponse> =
  PublishMessageResponseZodSchema;

const SagaSSEEventTypeZodSchema: z.ZodType<SagaSSEEventType> = z.enum([
  'saga:started',
  'saga:message_received',
  'saga:state_changed',
  'saga:completed',
  'saga:failed',
  'saga:compensating',
  'heartbeat',
]);

/** Schema for saga SSE event type values. */
export const SagaSSEEventTypeSchema: ContractSchema<SagaSSEEventType> = SagaSSEEventTypeZodSchema;

const SagaSSEEventZodSchema: z.ZodType<SagaSSEEvent> = z.object({
  type: SagaSSEEventTypeZodSchema,
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

/** Schema for saga subscription event payloads. */
export const SagaSSEEventSchema: ContractSchema<SagaSSEEvent> = SagaSSEEventZodSchema;

const SagaFiltersZodSchema: z.ZodType<SagaFilters> = z.object(SagaFiltersShape);

/** Schema for list-sagas query filters. */
export const SagaFiltersSchema: ContractSchema<SagaFilters> = SagaFiltersZodSchema;

const InstanceFiltersShape: z.ZodRawShape = {
  sagaName: z.string().optional(),
  sagaId: z.string().optional(),
  status: z.enum(SAGA_INSTANCE_STATUSES).nullable().optional(),
  topic: z.string().optional(),
};

const InstanceFiltersZodSchema: z.ZodType<InstanceFilters> = z.object(InstanceFiltersShape);

/** Schema for list-instances query filters. */
export const InstanceFiltersSchema: ContractSchema<InstanceFilters> = InstanceFiltersZodSchema;

const SagaHistoryEntryZodSchema: z.ZodType<SagaHistoryEntry> = z.object({
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
      .input(OffsetPaginationQueryZodSchema.extend(SagaFiltersShape))
      .output(z.object({
        sagas: z.array(SagaDefinitionResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getSaga: baseContract
      .route({ method: 'GET', path: '/sagas/{id}' })
      .input(z.object({ id: z.string() }))
      .output(SagaDefinitionResponseZodSchema),

    listInstances: baseContract
      .route({ method: 'GET', path: '/instances' })
      .input(OffsetPaginationQueryZodSchema.extend(InstanceFiltersShape))
      .output(z.object({
        instances: z.array(SagaInstanceResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getInstance: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}' })
      .input(z.object({ sagaName: z.string(), correlationId: z.string() }))
      .output(SagaInstanceResponseZodSchema),

    getInstanceHistory: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}/history' })
      .input(z.object({
        sagaName: z.string(),
        correlationId: z.string(),
        limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
        offset: z.coerce.number().int().nonnegative().default(0).optional(),
      }))
      .output(z.object({
        history: z.array(SagaHistoryEntryZodSchema),
        total: nonNegativeInt('Total count'),
      })),

    publish: baseContract
      .route({ method: 'POST', path: '/publish' })
      .input(PublishMessageInputZodSchema)
      .output(PublishMessageResponseZodSchema),

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
      .output(eventIterator(SagaSSEEventZodSchema)),
  } satisfies Parameters<typeof implement>[0];
}

/** Schema for saga transition history entries. */
export const SagaHistoryEntrySchema: ContractSchema<SagaHistoryEntry> = SagaHistoryEntryZodSchema;

/** Explicit public contract shape for saga service clients. */
export type SagasContractDefinition = Readonly<{
  listSagas: ContractProcedureLike;
  getSaga: ContractProcedureLike;
  listInstances: ContractProcedureLike;
  getInstance: ContractProcedureLike;
  getInstanceHistory: ContractProcedureLike;
  publish: ContractProcedureLike<PublishMessageInput, PublishMessageResponse>;
  subscribe: ContractProcedureLike;
}>;

/** Structural route handler exposed by the implemented saga router. */
export type SagasRouteHandler = Readonly<{
  // deno-lint-ignore no-explicit-any -- structural oRPC server-contract export keeps JSR slow types contained.
  handler: <THandler extends (options: any) => unknown>(handler: THandler) => ReturnType<THandler>;
}>;

/** Structural saga router returned after binding a context. */
export type SagasRouter = Readonly<{ [TKey in keyof SagasContractDefinition]: SagasRouteHandler }>;

/** Context-binding contract wrapper for the v1 saga contract. */
export type SagasContractV1 = Readonly<{ $context: <TContext>() => SagasRouter }>;

const sagasContractDefinition = createSagasContractDefinition();

/** oRPC contract definition for the saga service API. */
export const sagasContract: SagasContractDefinition =
  sagasContractDefinition as unknown as SagasContractDefinition;

/** Implemented saga service contract with structural context binding. */
export const sagasContractV1: SagasContractV1 = implement(
  sagasContractDefinition,
) as unknown as SagasContractV1;
