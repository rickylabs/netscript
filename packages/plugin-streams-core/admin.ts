/**
 * @module
 * Whole-stream administrative adapter and contracts for background services.
 */
export { DurableStreamAdmin } from './src/adapters/durable-stream-admin.ts';
export {
  deleteDurableStream,
  headDurableStream,
  StreamAdminError,
} from './src/application/administer-durable-stream.ts';
export type { StreamAdminOptionsV1 } from './src/application/administer-durable-stream.ts';
export type {
  StreamAdminInputV1,
  StreamAdminInstrumentationV1,
  StreamAdminPort,
} from './src/ports/stream-admin-port.ts';
export type {
  StreamAdminSpanV1,
  StreamDeletionV1,
  StreamHeadV1,
} from './src/domain/admin-contract-v1.ts';
export type {
  StreamProducerTransportFailureKindV1,
  StreamProducerTransportFailureV1,
  StreamProducerTransportResultV1,
} from './src/domain/producer-contract-v1.ts';
