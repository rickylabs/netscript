import type { PluginCapabilities } from '@netscript/plugin/contract-base';

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

/** Public response returned for worker job definitions. */
export type JobDefinitionResponse = Readonly<Record<string, unknown>>;

/** Public response returned for worker execution records. */
export type ExecutionRecordResponse = Readonly<Record<string, unknown> & { executionId: string }>;

/** Public response returned for worker task definitions. */
export type TaskDefinitionResponse = Readonly<Record<string, unknown>>;

/** Server-sent event payload emitted by the workers service. */
export type SSEEvent = Readonly<Record<string, unknown>>;

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
  describe: ContractProcedureLike<void, PluginCapabilities>;
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

/** Structural route handler exposed by the implemented worker router. */
export type WorkersRouteHandler = Readonly<{
  // deno-lint-ignore no-explicit-any -- structural oRPC server-contract export keeps JSR slow types contained.
  handler: <THandler extends (options: any) => unknown>(handler: THandler) => ReturnType<THandler>;
}>;

/** Structural worker router returned after binding a context. */
export type WorkersRouter = Readonly<{ [TKey in keyof WorkersContract]: WorkersRouteHandler }>;

/** Context-binding contract wrapper for the v1 worker contract. */
export type WorkersContractV1 = Readonly<{ $context: <TContext>() => WorkersRouter }>;
