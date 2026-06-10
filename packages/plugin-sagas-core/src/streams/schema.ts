import {
  type CollectionDefinition,
  type CollectionEventHelpers,
  defineStreamSchema,
  type StateSchema,
  type StreamStateDefinition,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { SAGA_INSTANCE_STATUSES } from '../domain/mod.ts';

/** Result returned by a stream entity schema parse attempt. */
export type StreamSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for durable stream entities. */
export interface StreamSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): StreamSchemaResult<TOutput>;
}

/** Saga instance entity stored in the durable stream. */
export type SagaInstance = Readonly<{
  instanceId: string;
  sagaId: string;
  correlationKey: string;
  status: (typeof SAGA_INSTANCE_STATUSES)[number];
  state: Record<string, unknown>;
  currentStep?: string;
  message?: Record<string, unknown>;
  error?: string;
  version: number;
  messageCount: number;
  lastMessageType?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  traceparent?: string;
  tracestate?: string;
}>;

const SagaInstanceZodSchema: z.ZodObject<Record<string, z.ZodType<unknown>>> = z.object({
  instanceId: z.string().min(1),
  sagaId: z.string().min(1),
  correlationKey: z.string().min(1),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  state: z.record(z.string(), z.unknown()).default({}),
  currentStep: z.string().optional(),
  message: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  version: z.number().int().nonnegative().default(0),
  messageCount: z.number().int().nonnegative().default(0),
  lastMessageType: z.string().optional(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

/** Standard Schema-compatible schema for saga instances. */
export const SagaInstanceSchema: StreamSchema<SagaInstance> =
  SagaInstanceZodSchema as unknown as StreamSchema<SagaInstance>;

/** Durable stream schema definition for saga instance entities. */
export type SagasStreamDefinition = Readonly<{
  sagaInstance: {
    readonly schema: typeof SagaInstanceSchema;
    readonly type: 'saga-instance';
    readonly primaryKey: 'instanceId';
  };
}>;

/** Entity-based durable stream schema for saga instances. */
export const sagasStreamSchema: StateSchema<SagasStreamDefinition> = defineStreamSchema({
  sagaInstance: {
    schema: SagaInstanceZodSchema,
    type: 'saga-instance',
    primaryKey: 'instanceId',
  },
}) as unknown as StateSchema<SagasStreamDefinition>;

export type { CollectionDefinition, CollectionEventHelpers, StateSchema, StreamStateDefinition };
