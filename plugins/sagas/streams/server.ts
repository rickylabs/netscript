/**
 * Server-side stream mirror exports for the sagas plugin read model.
 *
 * @module
 */

export { getSagasStreamProducer, startSagasStreamMirror } from './producer.ts';
export type {
  SagaInstanceRecord,
  SagaInstanceRecordSelect,
  SagasStreamMirrorOptions,
  SagaStreamPrismaClient,
} from './producer.ts';
export { SagaInstanceSchema, sagasStreamSchema } from './schema.ts';
export type {
  DurableStreamProducer,
  SagasStreamDefinition,
  StateSchema,
  StreamProducerPort,
  StreamStateDefinition,
} from './producer.ts';
