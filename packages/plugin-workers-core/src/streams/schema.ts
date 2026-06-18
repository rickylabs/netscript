import { defineStreamSchema } from '@netscript/plugin-streams-core';
import type { z } from 'zod';
import { ExecutionRecordSchema, JobResponseSchema } from '../domain/mod.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;
/** Standard Schema compatible public schema surface for stream entities. */
export interface WorkerStreamStandardSchema<TOutput> {
  /** Standard Schema metadata and validation hooks. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined },
    ) =>
      | { readonly value: TOutput; readonly issues?: undefined }
      | {
        readonly issues: ReadonlyArray<{
          readonly message: string;
          readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
        }>;
      }
      | Promise<
        | { readonly value: TOutput; readonly issues?: undefined }
        | {
          readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
          }>;
        }
      >;
    readonly types?: { readonly input: unknown; readonly output: TOutput } | undefined;
  };
}

/** Package-owned structural schema surface for worker stream entities. */
export interface WorkerStreamEntitySchema<TOutput> extends WorkerStreamStandardSchema<TOutput> {
  /** Parse an unknown value into the entity output. */
  parse(value: unknown): TOutput;
  /** Validate an unknown value without throwing. */
  safeParse(value: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}

/** Package-owned structural stream collection definition. */
export interface WorkerStreamCollectionDefinition<TOutput> {
  /** Standard Schema compatible validator for collection entities. */
  readonly schema: WorkerStreamEntitySchema<TOutput>;
  /** State Protocol type discriminator emitted for the collection. */
  readonly type: string;
  /** Property name used as the entity primary key. */
  readonly primaryKey: string;
}

/** Structural stream schema definition map. */
export type StreamSchemaDefinition = Record<string, WorkerStreamCollectionDefinition<unknown>>;

/** Package-owned structural workers stream schema surface. */
export type WorkersStreamSchema<TDefinition extends StreamSchemaDefinition> = TDefinition;

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
  description: true,
}).partial({
  name: true,
  topic: true,
  enabled: true,
  description: true,
});
/** Stream entity schema for worker jobs. */
export const WorkerJobSchema: WorkerStreamEntitySchema<WorkerJob> =
  WorkerJobZodSchema as unknown as WorkerStreamEntitySchema<WorkerJob>;

/** Durable stream definition for worker execution and job entities. */
export type WorkersStreamDefinition = {
  /** Execution entity stream definition. */
  execution: WorkerStreamCollectionDefinition<WorkerExecution> & {
    /** Execution entity schema. */
    readonly schema: WorkerStreamEntitySchema<WorkerExecution>;
    /** Execution entity discriminator. */
    readonly type: 'execution';
    /** Execution entity primary key. */
    readonly primaryKey: 'id';
  };
  /** Job entity stream definition. */
  job: WorkerStreamCollectionDefinition<WorkerJob> & {
    /** Job entity schema. */
    readonly schema: WorkerStreamEntitySchema<WorkerJob>;
    /** Job entity discriminator. */
    readonly type: 'job';
    /** Job entity primary key. */
    readonly primaryKey: 'id';
  };
} & StreamSchemaDefinition;

/** Entity-based durable stream schema for worker executions and jobs. */
const workersStreamStateSchema = defineStreamSchema({
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
  workersStreamStateSchema as unknown as WorkersStreamSchema<WorkersStreamDefinition>;
