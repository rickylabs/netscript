/**
 * Checked command sink over the existing stream producer, no new queue or relay.
 * @module
 */
export { createStreamCommandOutboxSink } from './src/integration/commands/stream-command-sink.ts';
export type { StreamCommandSinkOptions } from './src/integration/commands/stream-command-sink.ts';
export type { StreamProducerPort, StreamWriteContextV1 } from './src/ports/stream-producer-port.ts';
export type {
  StreamProducerLifecycleStateV1,
  StreamProducerReadinessOptionsV1,
  StreamProducerStateSnapshotV1,
  StreamWriteCancellationReasonV1,
  StreamWriteOutcomeV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
  StreamWriteUnknownReasonV1,
} from './src/domain/producer-contract-v1.ts';
export type {
  CommandJson,
  CommandOutboxAcceptance,
  CommandOutboxDelivery,
  CommandOutboxSink,
  CommandTraceContext,
} from '@netscript/service/commands/relay';
export { STREAM_PRODUCER_LIFECYCLE_STATES_V1 } from './src/domain/producer-contract-v1.ts';
