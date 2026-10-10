/**
 * Compatibility exports for server-only workers streams.
 *
 * @module
 */

export { createStreamMutationHook, emitJobToStream, getWorkersStreamProducer } from './producer.ts';
export type {
  ExecutionConcept,
  ExecutionMutationHook,
  ExecutionRecord,
  ExecutionStatus,
  ExecutionTriggerType,
  WorkersStreamProducer,
} from './producer.ts';
export {
  WorkerExecutionSchema,
  WorkerJobSchema,
  workersStreamSchema,
} from '@netscript/plugin-workers-core/streams';
export type {
  StreamSchemaDefinition,
  WorkerExecution,
  WorkerJob,
  WorkersStreamDefinition,
  WorkersStreamSchema,
  WorkerStreamCollectionDefinition,
  WorkerStreamEntitySchema,
  WorkerStreamStandardSchema,
} from '@netscript/plugin-workers-core/streams';

export type { WorkerStreamEntities } from '@netscript/plugin-workers-core/streams';
export type {
  CollectionDefinition,
  CollectionEventHelpers,
  CollectionWithHelpers,
  StateSchema,
  StreamSchemaIssue,
  StreamSchemaValidationOptions,
  StreamSchemaValidationResult,
  StreamStandardSchema,
  StreamStateDefinition,
} from '@netscript/plugin-streams-core';
export type {
  ExecutionStatus as CanonicalExecutionStatus,
  TriggerType,
} from '@netscript/plugin-workers-core/runtime';
