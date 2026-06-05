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
import type { ContractProcedure, ErrorMap, Meta, Schema } from '@orpc/server';
import { eventIterator } from '@orpc/server';
import { baseContract } from '@netscript/shared';
import {
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
} from '@shared/utils';

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

export type SagaInstanceStatus =
  (typeof SagaInstanceStatusValues)[keyof typeof SagaInstanceStatusValues];
export type SagaSSEEventType = (typeof SagaSSEEventTypeValues)[keyof typeof SagaSSEEventTypeValues];
export type SagaHistoryOutcome = (typeof SagaOutcomeValues)[keyof typeof SagaOutcomeValues];

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

export type PublishMessageInput = Readonly<{
  type: string;
  payload?: Readonly<Record<string, unknown>>;
  correlationId?: string;
  topic?: string;
}>;

export type SagaSSEEvent = Readonly<{
  type: SagaSSEEventType;
  timestamp: string;
  sagaName?: string;
  correlationId?: string;
  data?: Readonly<Record<string, unknown>>;
}>;

export type SagaFilters = Readonly<{
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

export type InstanceFilters = Readonly<{
  sagaName?: string;
  status?: SagaInstanceStatus | null;
  topic?: string;
}>;

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

export type ListSagasInput = Readonly<{
  limit: number;
  offset: number;
  topic?: string;
  enabled?: boolean;
  tags?: string;
}>;

export type ListSagasOutput = Readonly<{
  sagas: readonly SagaDefinitionResponse[];
  total: number;
  limit: number;
  offset: number;
}>;

export type GetSagaInput = Readonly<{
  id: string;
}>;

export type ListInstancesInput = Readonly<{
  limit: number;
  offset: number;
  sagaName?: string;
  status?: SagaInstanceStatus | null;
  topic?: string;
}>;

export type ListInstancesOutput = Readonly<{
  instances: readonly SagaInstanceResponse[];
  total: number;
  limit: number;
  offset: number;
}>;

export type GetInstanceInput = Readonly<{
  sagaName: string;
  correlationId: string;
}>;

export type GetInstanceHistoryInput = Readonly<{
  sagaName: string;
  correlationId: string;
  limit?: number;
  offset?: number;
}>;

export type GetInstanceHistoryOutput = Readonly<{
  history: readonly SagaHistoryEntry[];
  total: number;
}>;

export type PublishMessageOutput = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
}>;

export type SubscribeInput =
  | Readonly<{
    sagaName?: string;
    topic?: string;
    streaming?: boolean;
  }>
  | undefined;

type ContractInputSchema<TOutput> = Schema<unknown, TOutput>;
type ContractOutputSchema<TOutput> = Schema<unknown, TOutput>;

export type SagasContractDefinition = Readonly<{
  listSagas: ContractProcedure<
    ContractInputSchema<ListSagasInput>,
    ContractOutputSchema<ListSagasOutput>,
    ErrorMap,
    Meta
  >;
  getSaga: ContractProcedure<
    ContractInputSchema<GetSagaInput>,
    ContractOutputSchema<SagaDefinitionResponse>,
    ErrorMap,
    Meta
  >;
  listInstances: ContractProcedure<
    ContractInputSchema<ListInstancesInput>,
    ContractOutputSchema<ListInstancesOutput>,
    ErrorMap,
    Meta
  >;
  getInstance: ContractProcedure<
    ContractInputSchema<GetInstanceInput>,
    ContractOutputSchema<SagaInstanceResponse>,
    ErrorMap,
    Meta
  >;
  getInstanceHistory: ContractProcedure<
    ContractInputSchema<GetInstanceHistoryInput>,
    ContractOutputSchema<GetInstanceHistoryOutput>,
    ErrorMap,
    Meta
  >;
  publish: ContractProcedure<
    ContractInputSchema<PublishMessageInput>,
    ContractOutputSchema<PublishMessageOutput>,
    ErrorMap,
    Meta
  >;
  subscribe: ContractProcedure<
    ContractInputSchema<SubscribeInput>,
    Schema<unknown, unknown>,
    ErrorMap,
    Meta
  >;
}>;

/** Saga definition response schema */
export const SagaDefinitionResponseSchema: z.ZodType<SagaDefinitionResponse> = z.object({
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

/** Saga instance state schema */
export const SagaInstanceResponseSchema: z.ZodType<SagaInstanceResponse> = z.object({
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

/** Message publish input schema */
export const PublishMessageInputSchema: z.ZodType<PublishMessageInput> = z.object({
  type: z.string().describe('Message type identifier'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Message payload JSON object'),
  correlationId: z.string().optional().describe('Optional correlation ID for routing'),
  topic: z.string().optional().describe('Optional topic override'),
});

/** SSE event schema for saga updates */
export const SagaSSEEventSchema: z.ZodType<SagaSSEEvent> = z.object({
  type: z.enum(SagaSSEEventTypeValues),
  timestamp: z.string().datetime(),
  sagaName: z.string().optional(),
  correlationId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

const SagaFiltersShape: SagaFiltersShapeSchema = {
  topic: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  tags: z.string().optional(),
};

export const SagaFiltersSchema: z.ZodType<SagaFilters> = z.object(SagaFiltersShape);

const InstanceFiltersShape: InstanceFiltersShapeSchema = {
  sagaName: z.string().optional(),
  status: z.enum(SagaInstanceStatusValues).nullable().optional(),
  topic: z.string().optional(),
};

export const InstanceFiltersSchema: z.ZodType<InstanceFilters> = z.object(InstanceFiltersShape);

// ============================================================================
// HISTORY SCHEMAS
// ============================================================================

/** Saga execution history entry schema */
export const SagaHistoryEntrySchema: z.ZodType<SagaHistoryEntry> = z.object({
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

// ============================================================================
// CONTRACT
// ============================================================================

function createSagasContractDefinition(): SagasContractDefinition {
  return {
    // SAGA DEFINITIONS
    listSagas: baseContract
      .route({ method: 'GET', path: '/sagas' })
      .input(OffsetPaginationQuerySchema.extend(SagaFiltersShape))
      .output(z.object({
        sagas: z.array(SagaDefinitionResponseSchema),
        total: nonNegativeInt({ description: 'Total count' }),
        limit: paginationLimit({ description: 'Results per page' }),
        offset: paginationOffset({ description: 'Current offset' }),
      })),

    getSaga: baseContract
      .route({ method: 'GET', path: '/sagas/{id}' })
      .input(z.object({ id: z.string() }))
      .output(SagaDefinitionResponseSchema),

    // SAGA INSTANCES
    listInstances: baseContract
      .route({ method: 'GET', path: '/instances' })
      .input(OffsetPaginationQuerySchema.extend(InstanceFiltersShape))
      .output(z.object({
        instances: z.array(SagaInstanceResponseSchema),
        total: nonNegativeInt({ description: 'Total count' }),
        limit: paginationLimit({ description: 'Results per page' }),
        offset: paginationOffset({ description: 'Current offset' }),
      })),

    getInstance: baseContract
      .route({ method: 'GET', path: '/instances/{sagaName}/{correlationId}' })
      .input(z.object({ sagaName: z.string(), correlationId: z.string() }))
      .output(SagaInstanceResponseSchema),

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
        history: z.array(SagaHistoryEntrySchema),
        total: nonNegativeInt({ description: 'Total count' }),
      })),

    // MESSAGE PUBLISHING
    publish: baseContract
      .route({ method: 'POST', path: '/publish' })
      .input(PublishMessageInputSchema)
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
      .output(eventIterator(SagaSSEEventSchema)),
  };
}

export const sagasContract: SagasContractDefinition = createSagasContractDefinition();
