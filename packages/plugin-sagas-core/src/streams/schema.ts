import { defineStreamSchema, type StateSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { SAGA_INSTANCE_STATUSES } from '../domain/mod.ts';

type ZodRecordObject = z.ZodObject<Record<string, z.ZodType<unknown>>>;

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

/** Standard Schema-compatible Zod schema for saga instances. */
export const SagaInstanceSchema: ZodRecordObject = z.object({
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

type SagasStreamDefinition = Readonly<{
  sagaInstance: {
    readonly schema: typeof SagaInstanceSchema;
    readonly type: 'saga-instance';
    readonly primaryKey: 'instanceId';
  };
}>;

/** Entity-based durable stream schema for saga instances. */
export const sagasStreamSchema: StateSchema<SagasStreamDefinition> = defineStreamSchema({
  sagaInstance: {
    schema: SagaInstanceSchema,
    type: 'saga-instance',
    primaryKey: 'instanceId',
  },
});
