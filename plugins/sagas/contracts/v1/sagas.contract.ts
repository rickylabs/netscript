/**
 * Sagas Service Contract - Version 1
 *
 * oRPC contract definition for the Sagas plugin API.
 * Provides endpoints for saga management, instance queries, and message publishing.
 *
 * @version v1.0.0
 * @module
 */

import { z } from 'zod';
import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import {
  baseContract,
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
} from '@netscript/contracts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for sagas plugin contracts. */
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

/** Structural oRPC procedure reference used by saga plugin contracts. */
export type ContractProcedureLike<TInput = unknown, TOutput = unknown> = Readonly<{
  '~orpc': Readonly<{
    inputSchema?: StandardSchemaLike<TInput>;
    outputSchema?: StandardSchemaLike<unknown, TOutput>;
  }>;
}>;

// ============================================================================
// SAGA DEFINITION SCHEMAS
// ============================================================================

const SagaInstanceStatusValues = {
  pending: 'pending',
  active: 'active',
  completed: 'completed',
  failed: 'failed',
  compensating: 'compensating',
} as const;

const SagaSSEEventTypeValues = {
  started: 'saga:started',
  messageReceived: 'saga:message_received',
  stateChanged: 'saga:state_changed',
  completed: 'saga:completed',
  failed: 'saga:failed',
  compensating: 'saga:compensating',
  heartbeat: 'heartbeat',
} as const;

const SagaOutcomeValues = {
  success: 'success',
  error: 'error',
  compensated: 'compensated',
} as const;

type CoercedBooleanSchema = ReturnType<typeof z.coerce.boolean>;

type SagaFiltersShapeSchema = Readonly<{
  topic: z.ZodOptional<z.ZodString>;
  enabled: z.ZodOptional<CoercedBooleanSchema>;
  tags: z.ZodOptional<z.ZodString>;
}>;

type InstanceFiltersShapeSchema = Readonly<{
  sagaName: z.ZodOptional<z.ZodString>;
  status: z.ZodOptional<z.ZodNullable<z.ZodEnum<typeof SagaInstanceStatusValues>>>;
  topic: z.ZodOptional<z.ZodString>;
}>;

/** Public saga instance status values returned by the API. */
export type SagaInstanceStatus = 'pending' | 'active' | 'completed' | 'failed' | 'compensating';
/** Server-sent event names emitted by the saga API. */
export type SagaSSEEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';
/** Saga transition outcomes returned by history endpoints. */
export type SagaHistoryOutcome = 'success' | 'error' | 'compensated';

/** Public response returned for a configured saga definition. */
export type SagaDefinitionResponse = Readonly<{
  id: string;
  name: string;
  description?: string;
  topic: string;
  enabled: boolean;
  entrypoint: string;
  tags?: readonly string[];
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
  correlationId: string;
  state: Readonly<Record<string, unknown>>;
  status: SagaInstanceStatus;
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
  idempotencyKey?: string;
  topic?: string;
}>;

/** Server-sent event payload emitted by saga subscriptions. */
export type SagaSSEEvent = Readonly<{
  type: SagaSSEEventType;
  timestamp: string;
  sagaName?: string;
  correlationId?: string;
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
  status?: SagaInstanceStatus | null;
  topic?: string;
}>;

/** Public history entry returned for saga state transitions. */
export type SagaHistoryEntry = Readonly<{
  id: string;
  sagaName: string;
  sagaId: string;
  correlationId: string;
  messageType: string;
  messageId?: string;
  previousState?: Readonly<Record<string, unknown>>;
  newState: Readonly<Record<string, unknown>>;
  outcome: SagaHistoryOutcome;
  error?: string;
  duration?: number;
  transitionAt: string;
}>;

/** Input accepted by the list-sagas endpoint. */
export type ListSagasInput = Readonly<{
  limit: number;
  offset: number;
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

/** Response returned by the list-sagas endpoint. */
export type ListSagasOutput = Readonly<{
  sagas: readonly SagaDefinitionResponse[];
  total: number;
  limit: number;
  offset: number;
}>;

/** Input accepted by the get-saga endpoint. */
export type GetSagaInput = Readonly<{
  id: string;
}>;

/** Input accepted by the list-instances endpoint. */
export type ListInstancesInput = Readonly<{
  limit: number;
  offset: number;
  sagaName?: string;
  status?: SagaInstanceStatus | null;
  topic?: string;
}>;

/** Response returned by the list-instances endpoint. */
export type ListInstancesOutput = Readonly<{
  instances: readonly SagaInstanceResponse[];
  total: number;
  limit: number;
  offset: number;
}>;

/** Input accepted by the get-instance endpoint. */
export type GetInstanceInput = Readonly<{
  sagaName: string;
  correlationId: string;
}>;

/** Input accepted by the instance-history endpoint. */
export type GetInstanceHistoryInput = Readonly<{
  sagaName: string;
  correlationId: string;
  limit?: number;
  offset?: number;
}>;

/** Response returned by the instance-history endpoint. */
export type GetInstanceHistoryOutput = Readonly<{
  history: readonly SagaHistoryEntry[];
  total: number;
}>;

/** Response returned after a saga message publish attempt. */
export type PublishMessageOutput = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
}>;

/** Optional query accepted by the subscribe endpoint. */
export type SubscribeInput =
  | Readonly<{
    sagaName?: string;
    topic?: string;
    streaming?: boolean;
  }>
  | undefined;

/** Explicit public contract shape for saga service clients. */
export type SagasContractDefinition = Readonly<{
  listSagas: ContractProcedureLike<ListSagasInput, ListSagasOutput>;
  getSaga: ContractProcedureLike<GetSagaInput, SagaDefinitionResponse>;
  listInstances: ContractProcedureLike<ListInstancesInput, ListInstancesOutput>;
  getInstance: ContractProcedureLike<GetInstanceInput, SagaInstanceResponse>;
  getInstanceHistory: ContractProcedureLike<GetInstanceHistoryInput, GetInstanceHistoryOutput>;
  publish: ContractProcedureLike<PublishMessageInput, PublishMessageOutput>;
  subscribe: ContractProcedureLike<SubscribeInput, unknown>;
}>;

const SagaDefinitionResponseZodSchema: z.ZodType<SagaDefinitionResponse> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  topic: z.string(),
  enabled: z.boolean(),
  entrypoint: z.string(),
  tags: z.array(z.string()).optional(),
  timeout: z.object({
    completionTimeout: z.number().optional(),
  }).optional(),
  retry: z.object({
    maxAttempts: z.number().optional(),
    initialDelay: z.number().optional(),
    maxDelay: z.number().optional(),
  }).optional(),
});

/** Schema for saga definition responses. */
export const SagaDefinitionResponseSchema: ContractSchema<SagaDefinitionResponse> =
  SagaDefinitionResponseZodSchema;

const SagaInstanceResponseZodSchema: z.ZodType<SagaInstanceResponse> = z.object({
  sagaName: z.string(),
  correlationId: z.string(),
  state: z.record(z.string(), z.unknown()),
  status: z.enum(SagaInstanceStatusValues),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  version: z.number(),
  messageCount: z.number(),
  lastMessageType: z.string().optional(),
});

/** Schema for saga instance responses. */
export const SagaInstanceResponseSchema: ContractSchema<SagaInstanceResponse> =
  SagaInstanceResponseZodSchema;

const PublishMessageInputZodSchema: z.ZodType<PublishMessageInput> = z.object({
  type: z.string().describe('Message type identifier'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Message payload JSON object'),
  correlationId: z.string().optional().describe('Optional correlation ID for routing'),
  idempotencyKey: z.string().optional().describe('Client idempotency key for dedup on retry'),
  topic: z.string().optional().describe('Optional topic override'),
});

/** Schema for publish endpoint input. */
export const PublishMessageInputSchema: ContractSchema<PublishMessageInput> =
  PublishMessageInputZodSchema;

const SagaSSEEventZodSchema: z.ZodType<SagaSSEEvent> = z.object({
  type: z.enum(SagaSSEEventTypeValues),
  timestamp: z.string().datetime(),
  sagaName: z.string().optional(),
  correlationId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** Schema for saga subscription event payloads. */
export const SagaSSEEventSchema: ContractSchema<SagaSSEEvent> = SagaSSEEventZodSchema;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

const SagaFiltersShape: SagaFiltersShapeSchema = {
  topic: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

const SagaFiltersZodSchema: z.ZodType<SagaFilters> = z.object(SagaFiltersShape);

/** Schema for list-sagas query filters. */
export const SagaFiltersSchema: ContractSchema<SagaFilters> = SagaFiltersZodSchema;

const InstanceFiltersShape: InstanceFiltersShapeSchema = {
  sagaName: z.string().optional(),
  status: z.enum(SagaInstanceStatusValues).nullable().optional(),
  topic: z.string().optional(),
};

const InstanceFiltersZodSchema: z.ZodType<InstanceFilters> = z.object(InstanceFiltersShape);

/** Schema for list-instances query filters. */
export const InstanceFiltersSchema: ContractSchema<InstanceFilters> = InstanceFiltersZodSchema;

// ============================================================================
// HISTORY SCHEMAS
// ============================================================================

const SagaHistoryEntryZodSchema: z.ZodType<SagaHistoryEntry> = z.object({
  id: z.string(),
  sagaName: z.string(),
  sagaId: z.string(),
  correlationId: z.string(),
  messageType: z.string(),
  messageId: z.string().optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()),
  outcome: z.enum(SagaOutcomeValues),
  error: z.string().optional(),
  duration: z.number().optional(),
  transitionAt: z.string().datetime(),
});

/** Schema for saga transition history entries. */
export const SagaHistoryEntrySchema: ContractSchema<SagaHistoryEntry> = SagaHistoryEntryZodSchema;

// ============================================================================
// CONTRACT
// ============================================================================

function createSagasContractDefinition(): Parameters<typeof implement>[0] {
  return {
    // SAGA DEFINITIONS
    listSagas: baseContract
      .route({ method: 'GET', path: '/sagas' })
      .input(OffsetPaginationQuerySchema.extend(SagaFiltersShape))
      .output(z.object({
        sagas: z.array(SagaDefinitionResponseZodSchema),
        total: nonNegativeInt({ description: 'Total count' }),
        limit: paginationLimit({ description: 'Results per page' }),
        offset: paginationOffset({ description: 'Current offset' }),
      })),

    getSaga: baseContract
      .route({ method: 'GET', path: '/sagas/{id}' })
      .input(z.object({ id: z.string() }))
      .output(SagaDefinitionResponseZodSchema),

    // SAGA INSTANCES
    listInstances: baseContract
      .route({ method: 'GET', path: '/instances' })
      .input(OffsetPaginationQuerySchema.extend(InstanceFiltersShape))
      .output(z.object({
        instances: z.array(SagaInstanceResponseZodSchema),
        total: nonNegativeInt({ description: 'Total count' }),
        limit: paginationLimit({ description: 'Results per page' }),
        offset: paginationOffset({ description: 'Current offset' }),
      })),

    getInstance: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}' })
      .input(z.object({ sagaName: z.string(), correlationId: z.string() }))
      .output(SagaInstanceResponseZodSchema),

    // INSTANCE HISTORY (Timeline)
    getInstanceHistory: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}/history' })
      .input(z.object({
        sagaName: z.string(),
        correlationId: z.string(),
        limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
        offset: z.coerce.number().int().min(0).default(0).optional(),
      }))
      .output(z.object({
        history: z.array(SagaHistoryEntryZodSchema),
        total: nonNegativeInt({ description: 'Total count' }),
      })),

    // MESSAGE PUBLISHING
    publish: baseContract
      .route({ method: 'POST', path: '/publish' })
      .input(PublishMessageInputZodSchema)
      .output(z.object({
        published: z.boolean(),
        messageType: z.string(),
        correlationId: z.string().optional(),
      })),

    // SSE SUBSCRIPTION
    subscribe: oc
      .route({ method: 'GET', path: '/subscribe' })
      .input(
        z.object({
          sagaName: z.string().optional(),
          topic: z.string().optional(),
          streaming: z.coerce.boolean().optional(),
        }).optional(),
      )
      .output(eventIterator(SagaSSEEventZodSchema)),
  } satisfies Parameters<typeof implement>[0];
}

const sagasContractDefinition = createSagasContractDefinition();

/** oRPC contract definition for the saga service API. */
export const sagasContract: SagasContractDefinition =
  sagasContractDefinition as unknown as SagasContractDefinition;

/** Structural Prisma saga instance record used by v1 service handlers. */
export interface SagasRoutePrismaRecord {
  /** Persisted instance id. */
  id: string;
  /** Saga name stored with the instance. */
  sagaName: string;
  /** Correlation id stored with the instance. */
  correlationId: string;
  /** Optimistic version number. */
  version: number;
  /** Whether the saga instance reached a completed terminal state. */
  isCompleted: boolean;
  /** Persisted saga state payload. */
  state: Record<string, unknown>;
  /** Creation timestamp. */
  createdAt: Date;
  /** Last update timestamp. */
  updatedAt: Date;
}

/** Structural Prisma saga history record used by v1 service handlers. */
export interface SagasRouteHistoryRecord {
  /** Persisted history id. */
  id: string;
  /** Saga name associated with the transition. */
  sagaName: string;
  /** Saga definition id associated with the transition. */
  sagaId: string;
  /** Correlation id associated with the transition. */
  correlationId: string;
  /** Step name associated with the transition. */
  stepName: string;
  /** Message type that caused the transition. */
  messageType: string;
  /** Optional message id that caused the transition. */
  messageId?: string | null;
  /** Optional previous state snapshot. */
  previousState?: Record<string, unknown> | null;
  /** Optional new state snapshot. */
  newState?: Record<string, unknown> | null;
  /** Optional transition outcome. */
  outcome?: string | null;
  /** Optional transition error. */
  error?: string | null;
  /** Optional transition duration in milliseconds. */
  duration?: number | null;
  /** Transition timestamp. */
  transitionAt: Date;
  /** History record creation timestamp. */
  createdAt: Date;
  /** Optional transition metadata. */
  metadata?: Record<string, unknown> | null;
}

/** Structural database client used by the v1 service router. */
export interface SagasRouteDatabaseClient {
  /** Saga instance query client. */
  sagaInstance: {
    /** Query saga instance records. */
    findMany(args: {
      where?: {
        sagaName?: string;
        correlationId?: string;
        isCompleted?: boolean;
        state?: { path: string[] | string; equals: string };
      };
      orderBy: { createdAt: 'desc' };
      take?: number;
      skip?: number;
    }): Promise<SagasRoutePrismaRecord[]>;
    /** Count saga instance records. */
    count(args: {
      where?: {
        sagaName?: string;
        correlationId?: string;
        isCompleted?: boolean;
        state?: { path: string[] | string; equals: string };
      };
    }): Promise<number>;
  };
  /** Saga execution history query client. */
  sagaExecutionHistory: {
    /** Query saga execution history records. */
    findMany(args: {
      where: { sagaName: string; correlationId: string };
      orderBy: { transitionAt: 'desc' };
      take?: number;
      skip?: number;
    }): Promise<SagasRouteHistoryRecord[]>;
    /** Count saga execution history records. */
    count(args: {
      where: { sagaName: string; correlationId: string };
    }): Promise<number>;
  };
}

/** Saga instance status filter accepted by structural route handlers. */
export type SagasRouteInstanceStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'failed'
  | 'compensating';

/** Runtime message shape published by structural route handlers. */
export type SagasRouteRuntimeMessage = Readonly<{
  /** Message type routed by saga handlers. */
  type: string;
  /** Optional JSON-like payload. */
  payload?: unknown;
  /** Optional saga correlation key. */
  correlationKey?: string;
  /** Message occurrence timestamp. */
  occurredAt: Date;
  /** W3C traceparent header. */
  traceparent?: string;
  /** W3C tracestate header. */
  tracestate?: string;
}>;

/** Runtime publish options accepted by structural route handlers. */
export type SagasRouteRuntimePublishOptions = Readonly<{
  /** W3C traceparent header. */
  traceparent?: string;
  /** W3C tracestate header. */
  tracestate?: string;
}>;

/** Runtime boundary required by structural route handlers. */
export interface SagasRouteRuntime {
  /** Publish one saga runtime message. */
  publish(
    message: SagasRouteRuntimeMessage,
    options?: SagasRouteRuntimePublishOptions,
  ): Promise<unknown>;
}

/** Structural input shape shared by v1 route handlers. */
export type SagasRouteInput = Readonly<{
  /** Saga definition identifier. */
  id: string;
  /** Saga definition name filter or route parameter. */
  sagaName: string;
  /** Saga correlation identifier. */
  correlationId: string;
  /** Message type routed by publish handlers. */
  type: string;
  /** Optional JSON-like message payload. */
  payload?: Readonly<Record<string, unknown>>;
  /** Pagination limit supplied by contract parsing. */
  limit: number;
  /** Pagination offset supplied by contract parsing. */
  offset: number;
  /** Optional topic filter. */
  topic?: string;
  /** Optional enabled filter. */
  enabled?: boolean;
  /** Optional saga instance status filter. */
  status?: SagasRouteInstanceStatus;
}>;

/** Structural context supplied to v1 route handlers. */
export type SagasRouteContext = Readonly<{
  db: SagasRouteDatabaseClient;
  sagaRuntime?: SagasRouteRuntime;
}>;

/** Handler options supplied by the structural v1 service router. */
export type SagasRouteHandlerOptions = Readonly<{
  input: SagasRouteInput;
  errors: unknown;
  path: readonly string[] | undefined;
  context: SagasRouteContext;
  lastEventId?: string;
  signal?: AbortSignal;
}>;

/** Structural route builder returned after binding a saga service context. */
export type SagasRouteHandler = Readonly<{
  handler<TOutput>(handler: (options: SagasRouteHandlerOptions) => TOutput): TOutput;
}>;

/** Structural saga router returned after binding a context. */
export type SagasRouter = Readonly<{ [TKey in keyof SagasContractDefinition]: SagasRouteHandler }>;

/** Context-binding contract wrapper for the v1 saga contract. */
export type SagasContractV1 = Readonly<{ $context: <TContext>() => SagasRouter }>;

/** Implemented saga service contract with structural context binding. */
export const sagasContractV1: SagasContractV1 = implement(
  sagasContractDefinition,
) as unknown as SagasContractV1;
