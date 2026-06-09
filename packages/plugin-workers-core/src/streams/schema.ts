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
  /** Unique execution identifier. */
  id: string;
  /** Job or task identifier associated with the execution. */
  jobId: string;
  /** Current execution status. */
  status: string;
  /** Stream topic associated with the execution. */
  topic?: string;
  /** Runtime concept represented by this execution. */
  concept?: 'job' | 'task';
  /** Correlation identifier used to join related executions. */
  correlationId?: string;
  /** ISO timestamp for when the execution was triggered. */
  triggeredAt?: string;
  /** ISO timestamp for when the execution started. */
  startedAt?: string | null;
  /** ISO timestamp for when the execution completed. */
  completedAt?: string | null;
  /** Execution duration in milliseconds. */
  duration?: number | null;
  /** Process-style exit code for the execution result. */
  exitCode?: number | null;
  /** Error message recorded for failed executions. */
  error?: string | null;
  /** Structured execution result payload. */
  result?: Record<string, unknown> | null;
  /** Worker identifier that ran the execution. */
  workerId?: string | null;
  /** Current retry attempt number. */
  attempt?: number;
}>;

/** Worker job entity stored in the durable stream. */
export type WorkerJob = Readonly<{
  /** Unique job identifier. */
  id: string;
  /** Human-readable job name. */
  name?: string;
  /** Stream topic associated with the job. */
  topic?: string;
  /** Whether the job is enabled. */
  enabled?: boolean;
  /** @deprecated Recurring jobs are modelled as scheduled triggers. */
  schedule?: unknown;
  /** Human-readable job description. */
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
/** Stream entity schema for worker executions. */
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
/** Stream entity schema for worker jobs. */
export const WorkerJobSchema: WorkerStreamEntitySchema<WorkerJob> =
  WorkerJobZodSchema as unknown as WorkerStreamEntitySchema<WorkerJob>;

/** Durable stream definition for worker execution and job entities. */
export type WorkersStreamDefinition = Readonly<{
  /** Execution entity stream definition. */
  execution: {
    /** Execution entity schema. */
    readonly schema: WorkerStreamEntitySchema<WorkerExecution>;
    /** Execution entity discriminator. */
    readonly type: 'execution';
    /** Execution entity primary key. */
    readonly primaryKey: 'id';
  };
  /** Job entity stream definition. */
  job: {
    /** Job entity schema. */
    readonly schema: WorkerStreamEntitySchema<WorkerJob>;
    /** Job entity discriminator. */
    readonly type: 'job';
    /** Job entity primary key. */
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
/** Stream schema definition for worker executions and jobs. */
export const workersStreamSchema: WorkersStreamSchema<WorkersStreamDefinition> =
  workersStreamStateSchema as WorkersStreamSchema<WorkersStreamDefinition>;
