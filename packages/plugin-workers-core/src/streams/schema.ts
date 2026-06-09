import { defineStreamSchema, type StateSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import { ExecutionRecordSchema, JobResponseSchema } from '../domain/mod.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;
/** Structural stream schema definition map. */
export type StreamSchemaDefinition = Readonly<Record<string, unknown>>;

/** Package-owned structural schema surface for worker stream entities. */
export interface WorkerStreamEntitySchema<TOutput> {
  /** Parse an unknown value into the entity output. */
  parse(value: unknown): TOutput;
  /** Validate an unknown value without throwing. */
  safeParse(value: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}

/** Package-owned structural workers stream schema surface. */
export interface WorkersStreamSchema<TDefinition extends StreamSchemaDefinition> {
  /** Stream entity definitions keyed by entity name. */
  readonly definition?: TDefinition;
}

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
const WorkerExecutionZodSchema: AnyZodObject = ExecutionRecordSchema.pick({
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
export const WorkerExecutionSchema: WorkerStreamEntitySchema<WorkerExecution> =
  WorkerExecutionZodSchema as unknown as WorkerStreamEntitySchema<WorkerExecution>;

/** Zod schema for a worker job entity stored in the durable stream. */
const WorkerJobZodSchema: AnyZodObject = JobResponseSchema.pick({
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
export const WorkerJobSchema: WorkerStreamEntitySchema<WorkerJob> =
  WorkerJobZodSchema as unknown as WorkerStreamEntitySchema<WorkerJob>;

export type WorkersStreamDefinition = Readonly<{
  execution: {
    readonly schema: WorkerStreamEntitySchema<WorkerExecution>;
    readonly type: 'execution';
    readonly primaryKey: 'id';
  };
  job: {
    readonly schema: WorkerStreamEntitySchema<WorkerJob>;
    readonly type: 'job';
    readonly primaryKey: 'id';
  };
}>;

/** Entity-based durable stream schema for worker executions and jobs. */
const workersStreamStateSchema: StateSchema<{
  execution: {
    readonly schema: typeof WorkerExecutionZodSchema;
    readonly type: 'execution';
    readonly primaryKey: 'id';
  };
  job: {
    readonly schema: typeof WorkerJobZodSchema;
    readonly type: 'job';
    readonly primaryKey: 'id';
  };
}> = defineStreamSchema({
  execution: {
    schema: WorkerExecutionZodSchema,
    type: 'execution',
    primaryKey: 'id',
  },
  job: {
    schema: WorkerJobZodSchema,
    type: 'job',
    primaryKey: 'id',
  },
});
export const workersStreamSchema: WorkersStreamSchema<WorkersStreamDefinition> =
  workersStreamStateSchema as WorkersStreamSchema<WorkersStreamDefinition>;
