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
  WorkerExecution,
  WorkerJob,
  WorkerStreamEntitySchema,
  StreamSchemaDefinition,
  WorkersStreamDefinition,
  WorkersStreamSchema,
} from './schema.ts';
