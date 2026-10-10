/**
 * @module @netscript/plugin-workers-core/streams
 *
 * Worker stream integration contracts.
 */

export {
  createStreamMutationHook,
  createWorkersStreamProducer,
  emitJobToStream,
  toExecutionStreamEntity,
} from './producer.ts';
export type {
  ExecutionMutation,
  ExecutionMutationHook,
  WorkerExecutionRecord,
  WorkersStreamProducer,
  WorkersStreamProducerOptions,
} from './producer.ts';
export { WorkerExecutionSchema, WorkerJobSchema, workersStreamSchema } from './schema.ts';
export type {
  StreamSchemaDefinition,
  WorkerExecution,
  WorkerJob,
  WorkersStreamDefinition,
  WorkersStreamSchema,
  WorkerStreamCollectionDefinition,
  WorkerStreamEntitySchema,
  WorkerStreamStandardSchema,
} from './schema.ts';

export type { WorkerStreamEntities } from './producer.ts';
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
