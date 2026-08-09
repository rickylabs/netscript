/**
 * @module @netscript/plugin-streams-core
 *
 * Durable stream schema, producer, configuration, telemetry, testing, and
 * diagnostics primitives for NetScript runtime plugins.
 *
 * @example Define a stream schema
 * ```ts
 * import { defineStreamSchema } from "@netscript/plugin-streams-core";
 *
 * const schema = defineStreamSchema({});
 * console.log(Object.keys(schema));
 * ```
 */

export { defineStreamSchema } from './src/public/mod.ts';
export { createDurableStream, DurableStreamProducer } from './src/public/mod.ts';
export { createServiceStreamProducer } from './src/public/mod.ts';
export { buildStreamUrl, getStreamsAuth, getStreamsUrl } from './src/public/mod.ts';
export { inspectStreamTopic } from './src/public/mod.ts';
export type {
  DurableStreamProducerOptions,
  StreamProducerAcknowledgementV1,
  StreamProducerAppendInputV1,
  StreamProducerBufferPolicyV1,
  StreamProducerClockPort,
  StreamProducerCloseInputV1,
  StreamProducerConnectInputV1,
  StreamProducerIdentityV1,
  StreamProducerLifecycleStateV1,
  StreamProducerPort,
  StreamProducerRandomPort,
  StreamProducerReadinessOptionsV1,
  StreamProducerReconnectPolicyV1,
  StreamProducerStateSnapshotV1,
  StreamProducerTransportFailureKindV1,
  StreamProducerTransportFailureV1,
  StreamProducerTransportPort,
  StreamProducerTransportResultV1,
  StreamWriteCancellationReasonV1,
  StreamWriteContextV1,
  StreamWriteOutcomeV1,
  StreamWriteReceiptV1,
  StreamWriteRejectionReasonV1,
  StreamWriteUnknownReasonV1,
} from './src/public/mod.ts';
export {
  DEFAULT_STREAM_PRODUCER_BUFFER_POLICY_V1,
  DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1,
  STREAM_PRODUCER_LIFECYCLE_STATES_V1,
} from './src/public/mod.ts';
export type { ServiceStreamProducerOptions } from './src/public/mod.ts';
export type { StreamTopicInspectionInput, StreamTopicInspectionReport } from './src/public/mod.ts';
export type {
  ChangeEvent,
  CollectionDefinition,
  CollectionEventHelpers,
  CollectionWithHelpers,
  ControlEvent,
  Operation,
  StateEvent,
  StateSchema,
  StreamSchemaIssue,
  StreamSchemaValidationOptions,
  StreamSchemaValidationResult,
  StreamStandardSchema,
  StreamStateDefinition,
} from './src/public/mod.ts';
