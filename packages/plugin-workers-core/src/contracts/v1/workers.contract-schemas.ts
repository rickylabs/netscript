import { z } from 'zod';
import {
  ExecutionRecordSchema,
  ExecutionStatusSchema,
  JobEditableSchema,
  JobResponseSchema,
  JobSourceSchema,
  JobTriggerEventSchema,
  SSEEventSchema as DomainSSEEventSchema,
  TaskResponseSchema,
  TaskSourceSchema,
} from '../../domain/mod.ts';
import type {
  ContractSchema,
  ExecutionRecordResponse,
  JobDefinitionResponse,
  JobTriggerInput,
  SSEEvent,
  TaskDefinitionResponse,
  TaskTriggerInput,
} from './workers.contract-types.ts';

export const nonNegativeInt = (description: string): z.ZodNumber =>
  z.number().int().nonnegative().describe(description);

export const paginationLimit = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().min(1).max(1000).default(50).describe(description);

export const paginationOffset = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().nonnegative().default(0).describe(description);

type OffsetPaginationQueryShape = {
  limit: z.ZodType<number>;
  offset: z.ZodType<number>;
};

const OffsetPaginationQueryShapeValue: OffsetPaginationQueryShape = {
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
};
const OffsetPaginationQueryShape: OffsetPaginationQueryShape = OffsetPaginationQueryShapeValue;

export const OffsetPaginationQuerySchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z.object(
  OffsetPaginationQueryShape,
);

export const JobDefinitionResponseZodSchema: typeof JobResponseSchema = JobResponseSchema;

/** Schema for worker job definition responses. */
export const JobDefinitionResponseSchema: ContractSchema<JobDefinitionResponse> =
  JobDefinitionResponseZodSchema;

type ExecutionRecordResponseShape =
  & Omit<
    typeof ExecutionRecordSchema.shape,
    'correlationId' | 'exitCode' | 'payload' | 'traceparent' | 'tracestate' | 'workerId'
  >
  & { executionId: z.ZodType<string> };

const ExecutionRecordResponseSchemaValue: z.ZodObject<ExecutionRecordResponseShape> =
  ExecutionRecordSchema.omit({
    workerId: true,
    payload: true,
    correlationId: true,
    traceparent: true,
    tracestate: true,
    exitCode: true,
  }).extend({
    executionId: z.string().uuid().describe('Execution ID'),
  });

export const ExecutionRecordResponseZodSchema: z.ZodObject<ExecutionRecordResponseShape> =
  ExecutionRecordResponseSchemaValue;

/** Schema for worker execution record responses. */
export const ExecutionRecordResponseSchema: ContractSchema<ExecutionRecordResponse> =
  ExecutionRecordResponseZodSchema;

export const TaskDefinitionResponseZodSchema: typeof TaskResponseSchema = TaskResponseSchema;

/** Schema for worker task definition responses. */
export const TaskDefinitionResponseSchema: ContractSchema<TaskDefinitionResponse> =
  TaskDefinitionResponseZodSchema;

type JobFiltersShape = {
  enabled: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  scheduled: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  source: z.ZodOptional<typeof JobSourceSchema>;
  pluginId: z.ZodOptional<z.ZodString>;
  tags: z.ZodOptional<z.ZodString>;
};

const JobFiltersShapeValue: JobFiltersShape = {
  enabled: z.coerce.boolean().optional(),
  scheduled: z.coerce.boolean().optional(),
  source: JobSourceSchema.optional(),
  pluginId: z.string().optional(),
  tags: z.string().optional(),
};
const JobFiltersShape: JobFiltersShape = JobFiltersShapeValue;

export const JobFiltersZodSchema: z.ZodObject<typeof JobFiltersShape> = z.object(JobFiltersShape);

/** Schema for list-jobs filters. */
export const JobFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobFiltersZodSchema;

type ExecutionFiltersShape = {
  jobId: z.ZodOptional<z.ZodString>;
  status: z.ZodOptional<typeof ExecutionStatusSchema>;
  topic: z.ZodOptional<z.ZodString>;
};

const ExecutionFiltersShapeValue: ExecutionFiltersShape = {
  jobId: z.string().optional(),
  status: ExecutionStatusSchema.optional(),
  topic: z.string().optional(),
};
const ExecutionFiltersShape: ExecutionFiltersShape = ExecutionFiltersShapeValue;

export const ExecutionFiltersZodSchema: z.ZodObject<typeof ExecutionFiltersShape> = z.object(
  ExecutionFiltersShape,
);

/** Schema for list-executions filters. */
export const ExecutionFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  ExecutionFiltersZodSchema;

type TaskFiltersShape = {
  type: z.ZodOptional<z.ZodString>;
  source: z.ZodOptional<typeof TaskSourceSchema>;
  pluginId: z.ZodOptional<z.ZodString>;
};

const TaskFiltersShapeValue: TaskFiltersShape = {
  type: z.string().optional(),
  source: TaskSourceSchema.optional(),
  pluginId: z.string().optional(),
};
const TaskFiltersShape: TaskFiltersShape = TaskFiltersShapeValue;

export const TaskFiltersZodSchema: z.ZodObject<typeof TaskFiltersShape> = z.object(
  TaskFiltersShape,
);

/** Schema for list-tasks filters. */
export const TaskFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  TaskFiltersZodSchema;

type JobCreateInputShape = typeof JobEditableSchema.shape & {
  id: z.ZodOptional<z.ZodString>;
  topic: z.ZodOptional<z.ZodString>;
};

const JobCreateInputShapeValue: JobCreateInputShape = {
  ...JobEditableSchema.shape,
  id: z.string().optional(),
  topic: z.string().optional(),
};
const JobCreateInputShape: JobCreateInputShape = JobCreateInputShapeValue;

export const JobCreateInputZodSchema: z.ZodObject<typeof JobCreateInputShape> = z.object(
  JobCreateInputShape,
);

/** Schema for creating worker job definitions. */
export const JobCreateInputSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobCreateInputZodSchema;

type JobUpdateInputShape = {
  [TKey in keyof typeof JobEditableSchema.shape]: z.ZodOptional<
    typeof JobEditableSchema.shape[TKey]
  >;
};

const JobUpdateInputShape: JobUpdateInputShape = JobEditableSchema.partial().shape;
const JobUpdateInputSchemaValue: z.ZodObject<JobUpdateInputShape> = z.object(JobUpdateInputShape);
export const JobUpdateInputZodSchema: z.ZodObject<JobUpdateInputShape> = JobUpdateInputSchemaValue;

/** Schema for updating worker job definitions. */
export const JobUpdateInputSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobUpdateInputZodSchema;

type JobUpdateWithIdShape = JobUpdateInputShape & {
  id: z.ZodString;
};

const JobUpdateWithIdShapeValue: JobUpdateWithIdShape = {
  ...JobEditableSchema.partial().shape,
  id: z.string(),
};
const JobUpdateWithIdShape: JobUpdateWithIdShape = JobUpdateWithIdShapeValue;

export const JobUpdateWithIdZodSchema: z.ZodObject<typeof JobUpdateWithIdShape> = z.object(
  JobUpdateWithIdShape,
);

/** Schema for updating a worker job definition by id. */
export const JobUpdateWithIdSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobUpdateWithIdZodSchema;

type JobTriggerInputShape =
  & Pick<
    typeof JobTriggerEventSchema.shape,
    'delay' | 'payload' | 'priority' | 'traceparent' | 'tracestate'
  >
  & {
    id: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
  };

const JobTriggerInputShape: JobTriggerInputShape = {
  ...JobTriggerEventSchema.pick({
    payload: true,
    priority: true,
    delay: true,
    traceparent: true,
    tracestate: true,
  }).shape,
  // The `{id}` path segment is the single source of truth for the target job:
  // oRPC merges the OpenAPI path param into `input.id`, so the body value is only
  // an optional fallback for RPC transports. The handler fails loudly when no id
  // resolves rather than persisting an `undefined` KV key.
  id: z.string().optional().describe('Job id (resolved from the {id} path segment)'),
  correlationId: z.string().optional().describe('Correlation ID for tracing'),
};

const JobTriggerInputSchemaValue: z.ZodObject<JobTriggerInputShape> = z.object(
  JobTriggerInputShape,
);
export const JobTriggerInputZodSchema: z.ZodObject<JobTriggerInputShape> =
  JobTriggerInputSchemaValue;

/** Schema for triggering a worker job by id. */
export const JobTriggerInputSchema: ContractSchema<JobTriggerInput> = JobTriggerInputZodSchema;

export const TaskTriggerInputZodSchema: z.ZodType<TaskTriggerInput> = z.object({
  // The `{id}` path segment is the single source of truth for the target task:
  // oRPC merges the OpenAPI path param into `input.id`, so the body value is only
  // an optional fallback for RPC transports. The handler fails loudly when no id
  // resolves rather than persisting an `undefined` KV key.
  id: z.string().optional().describe('Task id (resolved from the {id} path segment)'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Task payload'),
  priority: z.number().int().min(0).max(100).default(50).optional(),
  delay: z.number().int().nonnegative().optional().describe('Delay in ms'),
  correlationId: z.string().optional().describe('Correlation ID for tracing'),
});

export const SSEEventZodSchema: typeof DomainSSEEventSchema = DomainSSEEventSchema;

/** Schema for server-sent event payloads emitted by the workers service. */
export const SSEEventSchema: ContractSchema<SSEEvent> = SSEEventZodSchema;

export { ExecutionRecordSchema };
