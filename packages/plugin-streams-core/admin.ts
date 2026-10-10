/**
 * @module
 * Upstream whole-stream administrative adapter for background services.
 * Import helpers from the package root. Adapter signature types are intentionally
 * available here as well as at the root so this entrypoint has a complete type surface.
 */
export { DurableStreamAdmin } from './src/adapters/durable-stream-admin.ts';
export type { StreamAdminInputV1, StreamAdminPort } from './src/ports/stream-admin-port.ts';
export type { StreamDeletionV1, StreamHeadV1 } from './src/domain/admin-contract-v1.ts';
export type {
  StreamProducerTransportFailureKindV1,
  StreamProducerTransportFailureV1,
  StreamProducerTransportResultV1,
} from './src/domain/producer-contract-v1.ts';
