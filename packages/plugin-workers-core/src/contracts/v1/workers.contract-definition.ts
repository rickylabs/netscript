import { oc } from '@orpc/contract';
import type {
  AnySchema,
  ContractProcedureBuilderWithInputOutput,
  ErrorMap,
  MergedErrorMap,
} from '@orpc/contract';
import { eventIterator, implement } from '@orpc/server';
import { z } from 'zod';
import {
  BASE_PLUGIN_CONTRACT_ROUTES,
  BASE_PLUGIN_ERRORS,
  type BasePluginContract,
  type BasePluginDescribeRoute,
} from '@netscript/plugin/contract-base';
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

// Converge onto the shared plugin error vocabulary: NOT_FOUND, VALIDATION_ERROR,
// and INTERNAL are reported with identical status codes, messages, and payload
// shapes across every NetScript feature plugin. `BASE_PLUGIN_ERRORS` types each
// `data` field as `unknown` (it is a plain error vocabulary, not a builder
// fragment), so it crosses into the oRPC contract builder via the single
// sanctioned centralized-contract boundary cast — the same pattern
// `BASE_PLUGIN_CONTRACT_ROUTES` uses. Everything downstream of `baseContract`
// (routes, input/output schemas, the contract type, `implement`) is genuinely
// typed.
const baseContract: ReturnType<typeof oc.errors> = oc.errors(
  { ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0],
);

/**
 * Error map carried by every route built from {@link baseContract}.
 *
 * `baseContract` applies `.errors(...)`, so each route's error map is the base
 * vocabulary merged onto an empty map. Spelled once and shared by the
 * {@link Route} alias so the contract type is precise and isolated-declaration
 * clean without per-route hand-spelling.
 */
type BaseErrors = MergedErrorMap<Record<never, never>, ErrorMap>;

/**
 * Precise type of a route built via `baseContract.route(...).input(...).output(...)`.
 *
 * Parameterized on the input and output schemas so `typeof <inputConst>` and
 * `typeof <outputConst>` (each an explicitly-annotated Zod schema) flow through
 * to {@link implement}, keeping every handler's input/output precisely typed.
 */
type Route<TIn extends AnySchema, TOut extends AnySchema> = ContractProcedureBuilderWithInputOutput<
  TIn,
  TOut,
  BaseErrors,
  Record<never, never>
>;

// --- Route input schemas -----------------------------------------------------
// Each inline `z.object(...)` is named and explicitly annotated so its `typeof`
// can feed the `Route<...>` alias under `--isolatedDeclarations`.

const listJobsInput: z.ZodObject<
  typeof OffsetPaginationQuerySchema.shape & typeof JobFiltersZodSchema.shape
> = OffsetPaginationQuerySchema.extend(JobFiltersZodSchema.shape);

const getJobInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const deleteJobInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const listExecutionsInput: z.ZodObject<
  typeof OffsetPaginationQuerySchema.shape & typeof ExecutionFiltersZodSchema.shape
> = OffsetPaginationQuerySchema.extend(ExecutionFiltersZodSchema.shape);

const getExecutionInput: z.ZodObject<{
  jobId: z.ZodString;
  executionId: z.ZodString;
  topic: z.ZodOptional<z.ZodString>;
}> = z.object({
  jobId: z.string(),
  executionId: z.string(),
  topic: z.string().optional(),
});

const batchQueryExecutionsInput: z.ZodObject<{
  jobId: z.ZodString;
  triggeredAfter: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
  triggeredBefore: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
  correlationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
  limit: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  jobId: z.string(),
  triggeredAfter: z.union([z.string().datetime(), z.number()]).optional(),
  triggeredBefore: z.union([z.string().datetime(), z.number()]).optional(),
  correlationIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(1000).default(500),
});

const listExecutionsByCorrelationIdInput: z.ZodObject<{
  correlationId: z.ZodString;
  limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}> = z.object({
  correlationId: z.string(),
  limit: z.number().int().min(1).max(1000).default(50).optional(),
});

const listTasksInput: z.ZodObject<
  typeof OffsetPaginationQuerySchema.shape & typeof TaskFiltersZodSchema.shape
> = OffsetPaginationQuerySchema.extend(TaskFiltersZodSchema.shape);

const getTaskInput: z.ZodObject<{ id: z.ZodString }> = z.object({ id: z.string() });

const listTaskExecutionsInput: z.ZodObject<{
  taskId: z.ZodOptional<z.ZodString>;
  status: typeof ExecutionFiltersZodSchema.shape.status;
  topic: z.ZodOptional<z.ZodString>;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  taskId: z.string().optional(),
  status: ExecutionFiltersZodSchema.shape.status,
  topic: z.string().optional(),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const getTaskExecutionInput: z.ZodObject<{
  taskId: z.ZodString;
  executionId: z.ZodString;
  topic: z.ZodOptional<z.ZodString>;
}> = z.object({
  taskId: z.string(),
  executionId: z.string(),
  topic: z.string().optional(),
});

const emptyOptionalInput: z.ZodOptional<z.ZodObject<Record<never, never>>> = z.object({})
  .optional();

const cleanupDbExecutionsInput: z.ZodObject<{
  jobRetention: z.ZodRecord<
    z.ZodString,
    z.ZodObject<{ dbRetentionDays: z.ZodNumber; archiveToDb: z.ZodBoolean }>
  >;
  dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}> = z.object({
  jobRetention: z.record(
    z.string(),
    z.object({
      dbRetentionDays: z.number().int().nonnegative(),
      archiveToDb: z.boolean(),
    }),
  ),
  dryRun: z.boolean().optional().default(false),
});

const archiveExecutionsInput: z.ZodObject<{
  executions: z.ZodArray<typeof ExecutionRecordSchema>;
}> = z.object({ executions: z.array(ExecutionRecordSchema) });

const subscribeInput: z.ZodOptional<
  z.ZodObject<{
    jobId: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    concept: z.ZodOptional<z.ZodDefault<z.ZodEnum<{ job: 'job'; task: 'task' }>>>;
    streaming: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
  }>
> = z.object({
  jobId: z.string().optional(),
  topic: z.string().optional(),
  concept: z.enum(['job', 'task']).default('job').optional(),
  streaming: z.coerce.boolean().optional(),
}).optional();

// --- Route output schemas ----------------------------------------------------
// Outputs that wrap an already-named response schema reference it via `typeof`
// so the precise element type is preserved without re-spelling its shape.

const listJobsOutput: z.ZodObject<{
  jobs: z.ZodArray<typeof JobDefinitionResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
  offset: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  jobs: z.array(JobDefinitionResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
  offset: paginationOffset('Current offset'),
});

const deleteJobOutput: z.ZodObject<{ id: z.ZodString; deleted: z.ZodBoolean }> = z.object({
  id: z.string(),
  deleted: z.boolean(),
});

const triggerJobOutput: z.ZodObject<{ jobId: z.ZodString; triggered: z.ZodBoolean }> = z.object({
  jobId: z.string(),
  triggered: z.boolean(),
});

const listExecutionsOutput: z.ZodObject<{
  executions: z.ZodArray<typeof ExecutionRecordResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  executions: z.array(ExecutionRecordResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
});

const batchQueryExecutionItem: z.ZodObject<
  typeof ExecutionRecordResponseZodSchema.shape & {
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  }
> = ExecutionRecordResponseZodSchema.extend({
  payload: z.record(z.string(), z.unknown()).optional(),
});

const batchQueryExecutionsOutput: z.ZodObject<{
  executions: z.ZodArray<typeof batchQueryExecutionItem>;
  total: z.ZodNumber;
}> = z.object({
  executions: z.array(batchQueryExecutionItem),
  total: nonNegativeInt('Total matching'),
});

const listExecutionsByCorrelationIdOutput: z.ZodObject<{
  executions: z.ZodArray<typeof batchQueryExecutionItem>;
  total: z.ZodNumber;
}> = z.object({
  executions: z.array(batchQueryExecutionItem),
  total: nonNegativeInt('Total matching'),
});

const listTasksOutput: z.ZodObject<{
  tasks: z.ZodArray<typeof TaskDefinitionResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  tasks: z.array(TaskDefinitionResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
});

const triggerTaskOutput: z.ZodObject<{ taskId: z.ZodString; triggered: z.ZodBoolean }> = z.object({
  taskId: z.string(),
  triggered: z.boolean(),
});

const listTaskExecutionsOutput: z.ZodObject<{
  executions: z.ZodArray<typeof ExecutionRecordResponseZodSchema>;
  total: z.ZodNumber;
  limit: z.ZodDefault<z.ZodNumber>;
}> = z.object({
  executions: z.array(ExecutionRecordResponseZodSchema),
  total: nonNegativeInt('Total count'),
  limit: paginationLimit('Results per page'),
});

const cleanupOutput: z.ZodObject<{
  deleted: z.ZodArray<z.ZodString>;
  count: z.ZodNumber;
  message: z.ZodString;
}> = z.object({
  deleted: z.array(z.string()),
  count: nonNegativeInt('Number of deleted jobs'),
  message: z.string(),
});

const cleanupDbExecutionsOutput: z.ZodObject<{
  deleted: z.ZodRecord<z.ZodString, z.ZodNumber>;
  totalDeleted: z.ZodNumber;
  dryRun: z.ZodBoolean;
}> = z.object({
  deleted: z.record(z.string(), z.number()),
  totalDeleted: nonNegativeInt('Total records deleted'),
  dryRun: z.boolean(),
});

const archiveExecutionsOutput: z.ZodObject<{
  archived: z.ZodNumber;
  errors: z.ZodOptional<z.ZodArray<z.ZodString>>;
}> = z.object({
  archived: nonNegativeInt('Number of executions archived'),
  errors: z.array(z.string()).optional(),
});

const seedOutput: z.ZodObject<{
  jobsCreated: z.ZodArray<z.ZodString>;
  tasksCreated: z.ZodArray<z.ZodString>;
  message: z.ZodString;
}> = z.object({
  jobsCreated: z.array(z.string()),
  tasksCreated: z.array(z.string()),
  message: z.string(),
});

const listTopicsOutput: z.ZodObject<{
  topics: z.ZodArray<
    z.ZodObject<{
      topic: z.ZodString;
      jobCount: z.ZodNumber;
      executionCount: z.ZodNumber;
    }>
  >;
}> = z.object({
  topics: z.array(z.object({
    topic: z.string(),
    jobCount: nonNegativeInt('Number of jobs in this topic'),
    executionCount: nonNegativeInt('Number of recent executions'),
  })),
});

// --- subscribe route (built via `oc.route`, not `baseContract`) --------------
// `oc.route` carries no `.errors(...)`, so its error map is an empty
// `Record<never, never>` rather than {@link BaseErrors}; its output is an
// `eventIterator` whose type derives from the SSE event schema's input/output.

/** Output type produced by `eventIterator(SSEEventZodSchema)`. */
type SubscribeOutput = ReturnType<
  typeof eventIterator<z.input<typeof SSEEventZodSchema>, z.output<typeof SSEEventZodSchema>>
>;

/** Precise type of the `subscribe` streaming route. */
type SubscribeRoute = ContractProcedureBuilderWithInputOutput<
  typeof subscribeInput,
  SubscribeOutput,
  Record<never, never>,
  Record<never, never>
>;

/**
 * Explicit, precise type of the workers v1 contract definition.
 *
 * Every member is a real oRPC contract procedure typed against its input and
 * output Zod schemas. The interface `extends BasePluginContract`, so the
 * mandatory `describe` route is enforced by the seam and any additional route
 * must be a real contract router (the `[route: string]: AnyContractRouter`
 * constraint inherited from {@link BasePluginContract}). Spelling the type
 * explicitly is required by `--isolatedDeclarations` (the JSR slow-types bar);
 * because each member derives from a named, annotated schema via `typeof`, the
 * contract type can never silently drift from the schemas.
 */
interface WorkersContractDefinition extends BasePluginContract {
  readonly describe: BasePluginDescribeRoute;
  readonly listJobs: Route<typeof listJobsInput, typeof listJobsOutput>;
  readonly getJob: Route<typeof getJobInput, typeof JobDefinitionResponseZodSchema>;
  readonly createJob: Route<typeof JobCreateInputZodSchema, typeof JobDefinitionResponseZodSchema>;
  readonly updateJob: Route<
    typeof JobUpdateWithIdZodSchema,
    typeof JobDefinitionResponseZodSchema
  >;
  readonly deleteJob: Route<typeof deleteJobInput, typeof deleteJobOutput>;
  readonly triggerJob: Route<typeof JobTriggerInputZodSchema, typeof triggerJobOutput>;
  readonly listExecutions: Route<typeof listExecutionsInput, typeof listExecutionsOutput>;
  readonly getExecution: Route<typeof getExecutionInput, typeof ExecutionRecordResponseZodSchema>;
  readonly batchQueryExecutions: Route<
    typeof batchQueryExecutionsInput,
    typeof batchQueryExecutionsOutput
  >;
  readonly listExecutionsByCorrelationId: Route<
    typeof listExecutionsByCorrelationIdInput,
    typeof listExecutionsByCorrelationIdOutput
  >;
  readonly listTasks: Route<typeof listTasksInput, typeof listTasksOutput>;
  readonly getTask: Route<typeof getTaskInput, typeof TaskDefinitionResponseZodSchema>;
  readonly triggerTask: Route<typeof TaskTriggerInputZodSchema, typeof triggerTaskOutput>;
  readonly listTaskExecutions: Route<
    typeof listTaskExecutionsInput,
    typeof listTaskExecutionsOutput
  >;
  readonly getTaskExecution: Route<
    typeof getTaskExecutionInput,
    typeof ExecutionRecordResponseZodSchema
  >;
  readonly cleanup: Route<typeof emptyOptionalInput, typeof cleanupOutput>;
  readonly cleanupDbExecutions: Route<
    typeof cleanupDbExecutionsInput,
    typeof cleanupDbExecutionsOutput
  >;
  readonly archiveExecutions: Route<typeof archiveExecutionsInput, typeof archiveExecutionsOutput>;
  readonly seed: Route<typeof emptyOptionalInput, typeof seedOutput>;
  readonly subscribe: SubscribeRoute;
  readonly listTopics: Route<typeof emptyOptionalInput, typeof listTopicsOutput>;
}

/**
 * The workers v1 contract definition object.
 *
 * Spreads the mandatory base seam `describe` route and layers the 21
 * plugin-specific routes. The explicit {@link WorkersContractDefinition}
 * annotation makes the precise contract type available to `--isolatedDeclarations`
 * without erasing it; because the base seam `describe` is a real oRPC
 * `ContractProcedure` (no phantom marker) and every route is precisely typed,
 * this object is handed to `implement()` WITHOUT any erasure cast and every
 * `router.<route>.handler(...)` is checked against the contract's IO.
 */
const workersContractDefinition: WorkersContractDefinition = {
  // Mandatory base seam route: every feature plugin contract carries the typed
  // `describe` route (GET /describe) returning a `PluginCapabilities` document.
  ...BASE_PLUGIN_CONTRACT_ROUTES,

  listJobs: baseContract
    .route({ method: 'GET', path: '/jobs' })
    .input(listJobsInput)
    .output(listJobsOutput),

  getJob: baseContract
    .route({ method: 'GET', path: '/jobs/{id}' })
    .input(getJobInput)
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
    .input(deleteJobInput)
    .output(deleteJobOutput),

  triggerJob: baseContract
    .route({ method: 'POST', path: '/jobs/{id}/trigger' })
    .input(JobTriggerInputZodSchema)
    .output(triggerJobOutput),

  listExecutions: baseContract
    .route({ method: 'GET', path: '/executions' })
    .input(listExecutionsInput)
    .output(listExecutionsOutput),

  getExecution: baseContract
    .route({ method: 'GET', path: '/executions/{jobId}/{executionId}' })
    .input(getExecutionInput)
    .output(ExecutionRecordResponseZodSchema),

  batchQueryExecutions: baseContract
    .route({ method: 'POST', path: '/executions/query' })
    .input(batchQueryExecutionsInput)
    .output(batchQueryExecutionsOutput),

  listExecutionsByCorrelationId: baseContract
    .route({ method: 'GET', path: '/executions/by-correlation/{correlationId}' })
    .input(listExecutionsByCorrelationIdInput)
    .output(listExecutionsByCorrelationIdOutput),

  listTasks: baseContract
    .route({ method: 'GET', path: '/tasks' })
    .input(listTasksInput)
    .output(listTasksOutput),

  getTask: baseContract
    .route({ method: 'GET', path: '/tasks/{id}' })
    .input(getTaskInput)
    .output(TaskDefinitionResponseZodSchema),

  triggerTask: baseContract
    .route({ method: 'POST', path: '/tasks/{id}/trigger' })
    .input(TaskTriggerInputZodSchema)
    .output(triggerTaskOutput),

  listTaskExecutions: baseContract
    .route({ method: 'GET', path: '/task-executions' })
    .input(listTaskExecutionsInput)
    .output(listTaskExecutionsOutput),

  getTaskExecution: baseContract
    .route({ method: 'GET', path: '/task-executions/{taskId}/{executionId}' })
    .input(getTaskExecutionInput)
    .output(ExecutionRecordResponseZodSchema),

  cleanup: baseContract
    .route({ method: 'DELETE', path: '/cleanup' })
    .input(emptyOptionalInput)
    .output(cleanupOutput),

  cleanupDbExecutions: baseContract
    .route({ method: 'POST', path: '/cleanup/executions' })
    .input(cleanupDbExecutionsInput)
    .output(cleanupDbExecutionsOutput),

  archiveExecutions: baseContract
    .route({ method: 'POST', path: '/executions/archive' })
    .input(archiveExecutionsInput)
    .output(archiveExecutionsOutput),

  seed: baseContract
    .route({ method: 'POST', path: '/seed' })
    .input(emptyOptionalInput)
    .output(seedOutput),

  subscribe: oc
    .route({ method: 'GET', path: '/subscribe' })
    .input(subscribeInput)
    .output(eventIterator(SSEEventZodSchema)),

  listTopics: baseContract
    .route({ method: 'GET', path: '/topics' })
    .input(emptyOptionalInput)
    .output(listTopicsOutput),
};

/**
 * The fully-typed workers v1 contract definition type.
 *
 * Re-exported so {@link WorkersContract} and {@link WorkersContractV1} in
 * `workers.contract-types.ts` derive from it instead of hand-authoring a
 * parallel shape.
 */
export type { WorkersContractDefinition };

/**
 * Worker service contract definition for client generation.
 *
 * Carries the real, precise oRPC contract router type — no erasure cast.
 */
export const workersContract: WorkersContractDefinition = workersContractDefinition;

/**
 * The implemented (context-bindable) workers v1 contract.
 *
 * `implement(definition)` precisely types the implementer against the contract,
 * so every `router.<route>.handler(...)` is checked for input/output/error
 * conformance. The type is the real `implement` return type — no erasure cast.
 */
export const workersContractV1: ReturnType<typeof implement<WorkersContractDefinition>> = implement(
  workersContractDefinition,
);
