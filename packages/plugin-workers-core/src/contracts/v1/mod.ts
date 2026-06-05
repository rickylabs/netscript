/**
 * @module @netscript/plugin-workers-core/contracts/v1
 *
 * Versioned worker contracts for service and plugin consumers.
 */

export {};
export {
  ExecutionFiltersSchema,
  ExecutionRecordResponseSchema,
  JobCreateInputSchema,
  JobDefinitionResponseSchema,
  JobFiltersSchema,
  JobTriggerInputSchema,
  JobUpdateInputSchema,
  JobUpdateWithIdSchema,
  SSEEventSchema,
  TaskDefinitionResponseSchema,
  TaskFiltersSchema,
  workersContract,
  workersContractV1,
} from './workers.contract.ts';
export type {
  ExecutionRecordResponse,
  JobDefinitionResponse,
  SSEEvent,
  TaskDefinitionResponse,
} from './workers.contract.ts';
