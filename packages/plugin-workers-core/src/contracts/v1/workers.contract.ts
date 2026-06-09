/**
 * Workers Service Contract - Version 1
 *
 * oRPC contract definition for the Workers plugin API.
 *
 * @version v1.0.0
 * @module
 */

import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import {
  ExecutionRecordSchema,
  ExecutionStatusSchema,
  JobEditableSchema,
  JobResponseSchema,
  JobSourceSchema,
  JobTriggerEventSchema,
  SSEEventSchema as DomainSSEEventSchema,
  SSEEventTypes,
  TaskResponseSchema,
  TaskSourceSchema,
} from '../../domain/mod.ts';

/** Result returned by contract schema validation. */
export type ContractSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema surface for worker contracts. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ContractSchemaResult<TOutput>;
}

const nonNegativeInt = (description: string): z.ZodNumber =>
  z.number().int().nonnegative().describe(description);

const paginationLimit = (description: string): z.ZodDefault<z.ZodNumber> =>
  z.number().int().min(1).max(1000).default(50).describe(description);

const paginationOffset = (description: string): z.ZodDefault<z.ZodNumber> =>
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

const OffsetPaginationQuerySchema: z.ZodObject<typeof OffsetPaginationQueryShape> = z.object(
  OffsetPaginationQueryShape,
);

const baseContractValue: ReturnType<typeof oc.errors> = oc.errors({
  NOT_FOUND: {
    status: 404,
    message: 'Resource not found',
    data: z.object({
      resourceType: z.string(),
      resourceId: z.union([z.string(), z.number()]),
    }),
  },
  VALIDATION_ERROR: {
    status: 422,
    message: 'Validation failed',
    data: z.object({
      formErrors: z.array(z.string()),
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    }),
  },
});

type BaseContract = typeof baseContractValue;
const baseContract: BaseContract = baseContractValue;

/** Public response returned for worker job definitions. */
export type JobDefinitionResponse = Readonly<Record<string, unknown>>;

const JobDefinitionResponseZodSchema = JobResponseSchema;

/** Schema for worker job definition responses. */
export const JobDefinitionResponseSchema: ContractSchema<JobDefinitionResponse> =
  JobDefinitionResponseZodSchema as unknown as ContractSchema<JobDefinitionResponse>;

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

const ExecutionRecordResponseZodSchema = ExecutionRecordResponseSchemaValue;

/** Public response returned for worker execution records. */
export type ExecutionRecordResponse = Readonly<Record<string, unknown> & { executionId: string }>;

/** Schema for worker execution record responses. */
export const ExecutionRecordResponseSchema: ContractSchema<ExecutionRecordResponse> =
  ExecutionRecordResponseZodSchema as unknown as ContractSchema<ExecutionRecordResponse>;

/** Public response returned for worker task definitions. */
export type TaskDefinitionResponse = Readonly<Record<string, unknown>>;

const TaskDefinitionResponseZodSchema = TaskResponseSchema;

/** Schema for worker task definition responses. */
export const TaskDefinitionResponseSchema: ContractSchema<TaskDefinitionResponse> =
  TaskDefinitionResponseZodSchema as unknown as ContractSchema<TaskDefinitionResponse>;

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

const JobFiltersZodSchema: z.ZodObject<typeof JobFiltersShape> = z.object(JobFiltersShape);

/** Schema for list-jobs filters. */
export const JobFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobFiltersZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

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

const ExecutionFiltersZodSchema: z.ZodObject<typeof ExecutionFiltersShape> = z.object(
  ExecutionFiltersShape,
);

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

/** Schema for list-executions filters. */
export const ExecutionFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  ExecutionFiltersZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

const TaskFiltersZodSchema: z.ZodObject<typeof TaskFiltersShape> = z.object(TaskFiltersShape);

/** Schema for list-tasks filters. */
export const TaskFiltersSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  TaskFiltersZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

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

const JobCreateInputZodSchema: z.ZodObject<typeof JobCreateInputShape> = z.object(
  JobCreateInputShape,
);

/** Schema for creating worker job definitions. */
export const JobCreateInputSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobCreateInputZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

type JobUpdateInputShape = {
  [TKey in keyof typeof JobEditableSchema.shape]: z.ZodOptional<
    typeof JobEditableSchema.shape[TKey]
  >;
};

const JobUpdateInputShape: JobUpdateInputShape = JobEditableSchema.partial().shape;
const JobUpdateInputSchemaValue: z.ZodObject<JobUpdateInputShape> = z.object(JobUpdateInputShape);
const JobUpdateInputZodSchema = JobUpdateInputSchemaValue;

/** Schema for updating worker job definitions. */
export const JobUpdateInputSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobUpdateInputZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

type JobUpdateWithIdShape = JobUpdateInputShape & {
  id: z.ZodString;
};

const JobUpdateWithIdShapeValue: JobUpdateWithIdShape = {
  ...JobEditableSchema.partial().shape,
  id: z.string(),
};
const JobUpdateWithIdShape: JobUpdateWithIdShape = JobUpdateWithIdShapeValue;

const JobUpdateWithIdZodSchema: z.ZodObject<typeof JobUpdateWithIdShape> = z.object(
  JobUpdateWithIdShape,
);

/** Schema for updating a worker job definition by id. */
export const JobUpdateWithIdSchema: ContractSchema<Readonly<Record<string, unknown>>> =
  JobUpdateWithIdZodSchema as unknown as ContractSchema<Readonly<Record<string, unknown>>>;

type JobTriggerInputShape =
  & Pick<
    typeof JobTriggerEventSchema.shape,
    'delay' | 'payload' | 'priority' | 'traceparent' | 'tracestate'
  >
  & {
    id: z.ZodString;
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
  id: z.string(),
  correlationId: z.string().optional().describe('Correlation ID for tracing'),
};

const JobTriggerInputSchemaValue: z.ZodObject<JobTriggerInputShape> = z.object(
  JobTriggerInputShape,
);
const JobTriggerInputZodSchema = JobTriggerInputSchemaValue;

/** Schema for triggering a worker job by id. */
export const JobTriggerInputSchema: ContractSchema<JobTriggerInput> =
  JobTriggerInputZodSchema as unknown as ContractSchema<JobTriggerInput>;

/** Server-sent event payload emitted by the workers service. */
export type SSEEvent = Readonly<Record<string, unknown>>;

/** Schema for server-sent event payloads emitted by the workers service. */
export const SSEEventSchema: ContractSchema<SSEEvent> =
  DomainSSEEventSchema as unknown as ContractSchema<SSEEvent>;

/** Structural Standard Schema reference used by contract metadata. */
export type StandardSchemaLike<TInput = unknown, TOutput = TInput> = Readonly<{
  '~standard': Readonly<{
    types?: Readonly<{
      input: TInput;
      output: TOutput;
    }>;
  }>;
}>;

/** Structural oRPC procedure reference used by worker contracts. */
export type ContractProcedureLike<TInput = unknown, TOutput = unknown> = Readonly<{
  '~orpc': Readonly<{
    inputSchema?: StandardSchemaLike<TInput>;
    outputSchema?: StandardSchemaLike<unknown, TOutput>;
  }>;
}>;

/** Input accepted by the trigger-job procedure. */
export type JobTriggerInput = Readonly<{
  id: string;
  payload?: Record<string, unknown>;
  priority?: number;
  delay?: number;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Output returned by the trigger-job procedure. */
export type JobTriggerOutput = Readonly<{ jobId: string; triggered: boolean }>;

/** Input accepted by the trigger-task procedure. */
export type TaskTriggerInput = Readonly<{
  id: string;
  payload?: Record<string, unknown>;
  priority?: number;
  delay?: number;
  correlationId?: string;
}>;

/** Output returned by the trigger-task procedure. */
export type TaskTriggerOutput = Readonly<{ taskId: string; triggered: boolean }>;

/** Explicit public contract shape for worker service clients. */
export type WorkersContract = Readonly<{
  listJobs: ContractProcedureLike;
  getJob: ContractProcedureLike;
  createJob: ContractProcedureLike;
  updateJob: ContractProcedureLike;
  deleteJob: ContractProcedureLike;
  triggerJob: ContractProcedureLike<JobTriggerInput, JobTriggerOutput>;
  listExecutions: ContractProcedureLike;
  getExecution: ContractProcedureLike;
  batchQueryExecutions: ContractProcedureLike;
  listExecutionsByCorrelationId: ContractProcedureLike;
  listTasks: ContractProcedureLike;
  getTask: ContractProcedureLike;
  triggerTask: ContractProcedureLike<TaskTriggerInput, TaskTriggerOutput>;
  listTaskExecutions: ContractProcedureLike;
  getTaskExecution: ContractProcedureLike;
  cleanup: ContractProcedureLike;
  cleanupDbExecutions: ContractProcedureLike;
  archiveExecutions: ContractProcedureLike;
  seed: ContractProcedureLike;
  subscribe: ContractProcedureLike;
  listTopics: ContractProcedureLike;
}>;

export { SSEEventTypes };

function createWorkersContractDefinitionInferred(): Parameters<typeof implement>[0] {
  return {
    listJobs: baseContract
      .route({ method: 'GET', path: '/jobs' })
      .input(OffsetPaginationQuerySchema.extend(JobFiltersZodSchema.shape))
      .output(z.object({
        jobs: z.array(JobDefinitionResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      })),

    getJob: baseContract
      .route({ method: 'GET', path: '/jobs/{id}' })
      .input(z.object({ id: z.string() }))
      .output(JobDefinitionResponseZodSchema),

    createJob: baseContract
      .route({ method: 'POST', path: '/jobs' })
      .input(JobCreateInputZodSchema)
      .output(JobDefinitionResponseZodSchema),

    updateJob: baseContract
      .route({ method: 'PUT', path: '/jobs/{id}' })
      .input(JobUpdateWithIdZodSchema)
      .output(JobDefinitionResponseZodSchema),

    deleteJob: baseContract
      .route({ method: 'DELETE', path: '/jobs/{id}' })
      .input(z.object({ id: z.string() }))
      .output(z.object({ id: z.string(), deleted: z.boolean() })),

    triggerJob: baseContract
      .route({ method: 'POST', path: '/jobs/{id}/trigger' })
      .input(JobTriggerInputZodSchema)
      .output(z.object({ jobId: z.string(), triggered: z.boolean() })),

    listExecutions: baseContract
      .route({ method: 'GET', path: '/executions' })
      .input(OffsetPaginationQuerySchema.extend(ExecutionFiltersZodSchema.shape))
      .output(z.object({
        executions: z.array(ExecutionRecordResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
      })),

    getExecution: baseContract
      .route({ method: 'GET', path: '/executions/{jobId}/{executionId}' })
      .input(z.object({ jobId: z.string(), executionId: z.string(), topic: z.string().optional() }))
      .output(ExecutionRecordResponseZodSchema),

    batchQueryExecutions: baseContract
      .route({ method: 'POST', path: '/executions/query' })
      .input(z.object({
        jobId: z.string(),
        triggeredAfter: z.union([z.string().datetime(), z.number()]).optional(),
        triggeredBefore: z.union([z.string().datetime(), z.number()]).optional(),
        correlationIds: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(1000).default(500),
      }))
      .output(z.object({
        executions: z.array(ExecutionRecordResponseZodSchema.extend({
          payload: z.record(z.string(), z.unknown()).optional(),
        })),
        total: nonNegativeInt('Total matching'),
      })),

    listExecutionsByCorrelationId: baseContract
      .route({ method: 'GET', path: '/executions/by-correlation/{correlationId}' })
      .input(z.object({
        correlationId: z.string(),
        limit: z.number().int().min(1).max(1000).default(50).optional(),
      }))
      .output(z.object({
        executions: z.array(ExecutionRecordResponseZodSchema.extend({
          payload: z.record(z.string(), z.unknown()).optional(),
        })),
        total: nonNegativeInt('Total matching'),
      })),

    listTasks: baseContract
      .route({ method: 'GET', path: '/tasks' })
      .input(OffsetPaginationQuerySchema.extend(TaskFiltersZodSchema.shape))
      .output(z.object({
        tasks: z.array(TaskDefinitionResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
      })),

    getTask: baseContract
      .route({ method: 'GET', path: '/tasks/{id}' })
      .input(z.object({ id: z.string() }))
      .output(TaskDefinitionResponseZodSchema),

    triggerTask: baseContract
      .route({ method: 'POST', path: '/tasks/{id}/trigger' })
      .input(z.object({
        id: z.string(),
        payload: z.record(z.string(), z.unknown()).optional().describe('Task payload'),
        priority: z.number().int().min(0).max(100).default(50).optional(),
        delay: z.number().int().nonnegative().optional().describe('Delay in ms'),
        correlationId: z.string().optional().describe('Correlation ID for tracing'),
      }))
      .output(z.object({ taskId: z.string(), triggered: z.boolean() })),

    listTaskExecutions: baseContract
      .route({ method: 'GET', path: '/task-executions' })
      .input(z.object({
        taskId: z.string().optional(),
        status: ExecutionStatusSchema.optional(),
        topic: z.string().optional(),
        limit: paginationLimit('Results per page'),
        offset: paginationOffset('Current offset'),
      }))
      .output(z.object({
        executions: z.array(ExecutionRecordResponseZodSchema),
        total: nonNegativeInt('Total count'),
        limit: paginationLimit('Results per page'),
      })),

    getTaskExecution: baseContract
      .route({ method: 'GET', path: '/task-executions/{taskId}/{executionId}' })
      .input(z.object({
        taskId: z.string(),
        executionId: z.string(),
        topic: z.string().optional(),
      }))
      .output(ExecutionRecordResponseZodSchema),

    cleanup: baseContract
      .route({ method: 'DELETE', path: '/cleanup' })
      .input(z.object({}).optional())
      .output(z.object({
        deleted: z.array(z.string()),
        count: nonNegativeInt('Number of deleted jobs'),
        message: z.string(),
      })),

    cleanupDbExecutions: baseContract
      .route({ method: 'POST', path: '/cleanup/executions' })
      .input(z.object({
        jobRetention: z.record(
          z.string(),
          z.object({
            dbRetentionDays: z.number().int().nonnegative(),
            archiveToDb: z.boolean(),
          }),
        ),
        dryRun: z.boolean().optional().default(false),
      }))
      .output(z.object({
        deleted: z.record(z.string(), z.number()),
        totalDeleted: nonNegativeInt('Total records deleted'),
        dryRun: z.boolean(),
      })),

    archiveExecutions: baseContract
      .route({ method: 'POST', path: '/executions/archive' })
      .input(z.object({ executions: z.array(ExecutionRecordSchema) }))
      .output(z.object({
        archived: nonNegativeInt('Number of executions archived'),
        errors: z.array(z.string()).optional(),
      })),

    seed: baseContract
      .route({ method: 'POST', path: '/seed' })
      .input(z.object({}).optional())
      .output(z.object({
        jobsCreated: z.array(z.string()),
        tasksCreated: z.array(z.string()),
        message: z.string(),
      })),

    subscribe: oc
      .route({ method: 'GET', path: '/subscribe' })
      .input(
        z.object({
          jobId: z.string().optional(),
          topic: z.string().optional(),
          concept: z.enum(['job', 'task']).default('job').optional(),
          streaming: z.coerce.boolean().optional(),
        }).optional(),
      )
      .output(eventIterator(DomainSSEEventSchema)),

    listTopics: baseContract
      .route({ method: 'GET', path: '/topics' })
      .input(z.object({}).optional())
      .output(z.object({
        topics: z.array(z.object({
          topic: z.string(),
          jobCount: nonNegativeInt('Number of jobs in this topic'),
          executionCount: nonNegativeInt('Number of recent executions'),
        })),
      })),
  } satisfies Parameters<typeof implement>[0];
}
type WorkersContractDefinition = ReturnType<typeof createWorkersContractDefinitionInferred>;
function createWorkersContractDefinition(): WorkersContractDefinition {
  return createWorkersContractDefinitionInferred();
}
/** Worker service contract definition for client generation. */
export const workersContract: WorkersContract =
  createWorkersContractDefinition() as unknown as WorkersContract;
/** Structural route handler exposed by the implemented worker router. */
export type WorkersRouteHandler = Readonly<{
  // deno-lint-ignore no-explicit-any -- structural oRPC server-contract export keeps JSR slow types contained.
  handler: <THandler extends (options: any) => unknown>(handler: THandler) => ReturnType<THandler>;
}>;
/** Structural worker router returned after binding a context. */
export type WorkersRouter = Readonly<{ [TKey in keyof WorkersContract]: WorkersRouteHandler }>;

/** Context-binding contract wrapper for the v1 worker contract. */
export type WorkersContractV1 = Readonly<{ $context: <TContext>() => WorkersRouter }>;

/** Context-bindable worker service contract definition. */
export const workersContractV1: WorkersContractV1 = implement(
  createWorkersContractDefinition(),
) as unknown as WorkersContractV1;
