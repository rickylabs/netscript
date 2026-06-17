import { oc } from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import type { WorkersContract, WorkersContractV1 } from './workers.contract-types.ts';
import {
  ExecutionFiltersZodSchema,
  ExecutionRecordResponseZodSchema,
  ExecutionRecordSchema,
  JobCreateInputZodSchema,
  JobDefinitionResponseZodSchema,
  JobFiltersZodSchema,
  JobTriggerInputZodSchema,
  JobUpdateWithIdZodSchema,
  nonNegativeInt,
  OffsetPaginationQuerySchema,
  paginationLimit,
  paginationOffset,
  SSEEventZodSchema,
  TaskDefinitionResponseZodSchema,
  TaskFiltersZodSchema,
  TaskTriggerInputZodSchema,
} from './workers.contract-schemas.ts';

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
      .input(TaskTriggerInputZodSchema)
      .output(z.object({ taskId: z.string(), triggered: z.boolean() })),

    listTaskExecutions: baseContract
      .route({ method: 'GET', path: '/task-executions' })
      .input(z.object({
        taskId: z.string().optional(),
        status: ExecutionFiltersZodSchema.shape.status,
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
      .output(eventIterator(SSEEventZodSchema)),

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

/** Context-bindable worker service contract definition. */
export const workersContractV1: WorkersContractV1 = implement(
  createWorkersContractDefinition(),
) as unknown as WorkersContractV1;
