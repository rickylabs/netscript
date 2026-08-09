/**
 * @module
 *
 * Curated public surface for `@netscript/plugin-streams-core`.
 */

export {};
export { defineStreamSchema } from '../builders/define-stream-schema.ts';
export {
  createDurableStream,
  DurableStreamProducer,
} from '../application/create-durable-stream.ts';
export { createServiceStreamProducer } from '../application/create-service-stream-producer.ts';
export {
  buildStreamUrl,
  getStreamsAuth,
  getStreamsUrl,
} from '../application/stream-url-resolver.ts';
export { inspectStreamTopic } from '../diagnostics/inspect-stream-topic.ts';
export type {
  StreamTopicInspectionInput,
  StreamTopicInspectionReport,
} from '../diagnostics/inspect-stream-topic.ts';
export type { DurableStreamProducerOptions } from '../application/create-durable-stream.ts';
export type { ServiceStreamProducerOptions } from '../application/create-service-stream-producer.ts';
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
} from '../domain/stream-schema.ts';
export type { ChangeEvent, ControlEvent, Operation, StateEvent } from '../domain/stream-event.ts';
export {
  DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1,
  DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1,
  STREAM_PRODUCER_LIFECYCLE_STATES_V1,
} from '../domain/producer-contract-v1.ts';
export type {
  StreamProducerBufferPolicyV1,
  StreamProducerLifecycleStateV1,
  StreamProducerReadinessOptionsV1,
  StreamProducerReconnectPolicyV1,
  StreamProducerStateSnapshotV1,
  StreamProducerTransportFailureKindV1,
  StreamProducerTransportFailureV1,
  StreamWriteCancellationReasonV1,
  StreamWriteOutcomeV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
  StreamWriteUnknownReasonV1,
} from '../domain/producer-contract-v1.ts';
export type { StreamProducerClockPort } from '../ports/stream-producer-clock-port.ts';
export type { StreamProducerPort, StreamWriteContextV1 } from '../ports/stream-producer-port.ts';
export type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';
export type {
  StreamProducerAcknowledgementV1,
  StreamProducerAppendInputV1,
  StreamProducerCloseInputV1,
  StreamProducerConnectInputV1,
  StreamProducerIdentityV1,
  StreamProducerTransportPort,
  StreamProducerTransportResultV1,
} from '../ports/stream-producer-transport-port.ts';
