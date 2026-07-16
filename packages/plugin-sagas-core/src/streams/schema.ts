import {
  type CollectionDefinition,
  type CollectionEventHelpers,
  type CollectionWithHelpers,
  defineStreamSchema,
  type StateSchema,
  type StreamSchemaIssue,
  type StreamSchemaValidationOptions,
  type StreamSchemaValidationResult,
  type StreamStandardSchema,
  type StreamStateDefinition,
} from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { SAGA_INSTANCE_STATUSES, type SagaInstanceStatus } from '../domain/mod.ts';

/** Result returned by a stream entity schema parse attempt. */
export type StreamSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for durable stream entities. */
export type StreamSchema<TOutput = unknown, TInput = TOutput> =
  & CollectionDefinition<TOutput>['schema']
  & {
    /** Parse an input value or throw a validation error. */
    parse(input: TInput): TOutput;
    /** Parse an input value and return a result object instead of throwing. */
    safeParse(input: TInput): StreamSchemaResult<TOutput>;
  };

/** Saga instance entity stored in the durable stream. */
const SagaInstanceZodSchema: StreamSchema<SagaInstance, unknown> = z.object({
  instanceId: z.string().min(1),
  sagaId: z.string().min(1),
  correlationKey: z.string().min(1),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  state: z.record(z.string(), z.unknown()),
  currentStep: z.string().optional(),
  message: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  version: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  lastMessageType: z.string().optional(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  traceparent: z.string().optional(),
  tracestate: z.string().optional(),
});

/** Saga instance entity stored in the durable stream. */
export type SagaInstance = Readonly<{
  instanceId: string;
  sagaId: string;
  correlationKey: string;
  status: SagaInstanceStatus;
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

/** Standard Schema-compatible schema for saga instances. */
export const SagaInstanceSchema: StreamSchema<SagaInstance, unknown> = SagaInstanceZodSchema;

/** Durable stream schema definition for saga instance entities. */
export type SagasStreamDefinition = Readonly<{
  sagaInstance: {
    readonly schema: typeof SagaInstanceSchema;
    readonly type: 'saga-instance';
    readonly primaryKey: 'instanceId';
  };
}>;

/** Entity-based durable stream schema for saga instances. */
const sagasStreamDefinition: SagasStreamDefinition = {
  sagaInstance: {
    schema: SagaInstanceZodSchema,
    type: 'saga-instance',
    primaryKey: 'instanceId',
  },
};

/** Entity-based durable stream schema for saga instances. */
export const sagasStreamSchema: StateSchema<SagasStreamDefinition> = defineStreamSchema(
  sagasStreamDefinition,
);

export type {
  CollectionDefinition,
  CollectionEventHelpers,
  CollectionWithHelpers,
  SagaInstanceStatus,
  StateSchema,
  StreamSchemaIssue,
  StreamSchemaValidationOptions,
  StreamSchemaValidationResult,
  StreamStandardSchema,
  StreamStateDefinition,
};
export { SAGA_INSTANCE_STATUSES };
