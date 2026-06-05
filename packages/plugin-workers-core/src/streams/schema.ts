import { defineStreamSchema, type StateSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { ExecutionRecordSchema, JobResponseSchema } from '../domain/mod.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;

/** Worker execution entity stored in the durable stream. */
export type WorkerExecution = Readonly<{
  id: string;
  jobId: string;
  status: string;
  topic?: string;
  concept?: 'job' | 'task';
  correlationId?: string;
  triggeredAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  duration?: number | null;
  exitCode?: number | null;
  error?: string | null;
  result?: Record<string, unknown> | null;
  workerId?: string | null;
  attempt?: number;
}>;

/** Worker job entity stored in the durable stream. */
export type WorkerJob = Readonly<{
  id: string;
  name?: string;
  topic?: string;
  enabled?: boolean;
  /** @deprecated Recurring jobs are modelled as scheduled triggers. */
  schedule?: unknown;
  description?: string;
}>;

/** Zod schema for a worker execution entity stored in the durable stream. */
export const WorkerExecutionSchema: AnyZodObject = ExecutionRecordSchema.pick({
  id: true,
  jobId: true,
  topic: true,
  concept: true,
  status: true,
  correlationId: true,
  triggeredAt: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  exitCode: true,
  error: true,
  result: true,
  workerId: true,
  attempt: true,
}).partial({
  topic: true,
  concept: true,
  correlationId: true,
  triggeredAt: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  exitCode: true,
  error: true,
  result: true,
  workerId: true,
  attempt: true,
});

/** Zod schema for a worker job entity stored in the durable stream. */
export const WorkerJobSchema: AnyZodObject = JobResponseSchema.pick({
  id: true,
  name: true,
  topic: true,
  enabled: true,
  schedule: true,
  description: true,
}).partial({
  name: true,
  topic: true,
  enabled: true,
  schedule: true,
  description: true,
});

type WorkersStreamDefinition = Readonly<{
  execution: {
    readonly schema: typeof WorkerExecutionSchema;
    readonly type: 'execution';
    readonly primaryKey: 'id';
  };
  job: {
    readonly schema: typeof WorkerJobSchema;
    readonly type: 'job';
    readonly primaryKey: 'id';
  };
}>;

/** Entity-based durable stream schema for worker executions and jobs. */
export const workersStreamSchema: StateSchema<WorkersStreamDefinition> = defineStreamSchema({
  execution: {
    schema: WorkerExecutionSchema,
    type: 'execution',
    primaryKey: 'id',
  },
  job: {
    schema: WorkerJobSchema,
    type: 'job',
    primaryKey: 'id',
  },
});
