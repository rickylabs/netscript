import { defineStreamSchema } from '@netscript/plugin-streams-core';
import type { StateSchema, StreamStateDefinition } from '@netscript/plugin-streams-core';
import type { z } from 'zod';
import { ExecutionRecordSchema, JobResponseSchema } from '../domain/mod.ts';

/** Standard Schema compatible public schema surface for stream entities. */
export interface WorkerStreamStandardSchema<TOutput, TInput = unknown> {
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
    readonly types?: { readonly input: TInput; readonly output: TOutput } | undefined;
  };
}

/** Package-owned structural schema surface for worker stream entities. */
export interface WorkerStreamEntitySchema<TOutput, TInput = unknown>
  extends WorkerStreamStandardSchema<TOutput, TInput> {
  /** Parse an unknown value into the entity output. */
  parse(value: TInput): TOutput;
  /** Validate an unknown value without throwing. */
  safeParse(value: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}

/** Package-owned structural stream collection definition. */
export interface WorkerStreamCollectionDefinition<TOutput, TInput = unknown> {
  /** Standard Schema compatible validator for collection entities. */
  readonly schema: WorkerStreamEntitySchema<TOutput, TInput>;
  /** State Protocol type discriminator emitted for the collection. */
  readonly type: string;
  /** Property name used as the entity primary key. */
  readonly primaryKey: string;
}

/** Structural stream schema definition map. */
export type StreamSchemaDefinition = StreamStateDefinition;

/** Package-owned structural workers stream schema surface. */
export type WorkersStreamSchema<TDefinition extends StreamSchemaDefinition> = StateSchema<
  TDefinition
>;

/** Worker execution entity stored in the durable stream. */
export type WorkerExecution = Readonly<z.output<typeof WorkerExecutionZodSchema>>;

/** Worker job entity stored in the durable stream. */
export type WorkerJob = Readonly<z.output<typeof WorkerJobZodSchema>>;

type WorkerExecutionShape = {
  id: typeof ExecutionRecordSchema.shape.id;
  jobId: typeof ExecutionRecordSchema.shape.jobId;
  status: typeof ExecutionRecordSchema.shape.status;
  topic: z.ZodOptional<typeof ExecutionRecordSchema.shape.topic>;
  concept: z.ZodOptional<typeof ExecutionRecordSchema.shape.concept>;
  correlationId: z.ZodOptional<typeof ExecutionRecordSchema.shape.correlationId>;
  triggeredAt: z.ZodOptional<typeof ExecutionRecordSchema.shape.triggeredAt>;
  startedAt: z.ZodOptional<typeof ExecutionRecordSchema.shape.startedAt>;
  completedAt: z.ZodOptional<typeof ExecutionRecordSchema.shape.completedAt>;
  duration: z.ZodOptional<typeof ExecutionRecordSchema.shape.duration>;
  exitCode: z.ZodOptional<typeof ExecutionRecordSchema.shape.exitCode>;
  error: z.ZodOptional<typeof ExecutionRecordSchema.shape.error>;
  result: z.ZodOptional<typeof ExecutionRecordSchema.shape.result>;
  workerId: z.ZodOptional<typeof ExecutionRecordSchema.shape.workerId>;
  attempt: z.ZodOptional<typeof ExecutionRecordSchema.shape.attempt>;
};

/** Zod schema for a worker execution entity stored in the durable stream. */
const WorkerExecutionZodSchema: z.ZodObject<WorkerExecutionShape> = ExecutionRecordSchema.pick({
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
export const WorkerExecutionSchema: WorkerStreamEntitySchema<
  WorkerExecution,
  z.input<typeof WorkerExecutionZodSchema>
> = WorkerExecutionZodSchema;

type WorkerJobShape = {
  id: typeof JobResponseSchema.shape.id;
  name: z.ZodOptional<typeof JobResponseSchema.shape.name>;
  topic: z.ZodOptional<typeof JobResponseSchema.shape.topic>;
  enabled: z.ZodOptional<typeof JobResponseSchema.shape.enabled>;
  schedule: z.ZodOptional<typeof JobResponseSchema.shape.schedule>;
  description: z.ZodOptional<typeof JobResponseSchema.shape.description>;
};

/** Zod schema for a worker job entity stored in the durable stream. */
const WorkerJobZodSchema: z.ZodObject<WorkerJobShape> = JobResponseSchema.pick({
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
export const WorkerJobSchema: WorkerStreamEntitySchema<
  WorkerJob,
  z.input<typeof WorkerJobZodSchema>
> = WorkerJobZodSchema;

/** Durable stream definition for worker execution and job entities. */
export type WorkersStreamDefinition = Readonly<{
  execution: Readonly<{
    schema: typeof WorkerExecutionZodSchema;
    type: 'execution';
    primaryKey: 'id';
  }>;
  job: Readonly<{
    schema: typeof WorkerJobZodSchema;
    type: 'job';
    primaryKey: 'id';
  }>;
}>;

const workersStreamDefinition: WorkersStreamDefinition = {
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
};

/** Stream schema definition for worker executions and jobs. */
export const workersStreamSchema: WorkersStreamSchema<WorkersStreamDefinition> = defineStreamSchema(
  workersStreamDefinition,
);
