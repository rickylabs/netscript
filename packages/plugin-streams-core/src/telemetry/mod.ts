/**
 * @module
 *
 * Telemetry registration and attributes for NetScript stream operations.
 */

export type {
  StreamProducerStateSnapshotV1,
  StreamWriteOutcomeV1,
  StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';

export {
  StreamAttributes,
  type StreamAttributesMap,
  type StreamProducerMetricName,
  StreamProducerMetricNames,
  StreamSpanNames,
  type StreamSpanNamesMap,
  type StreamsSpanName,
  type StreamsTelemetryAttributeKey,
  type StreamsTelemetryAttributes,
} from './attributes.ts';
export {
  createStreamsInstrumentation,
  type StreamFanInMessage,
  StreamsInstrumentation,
  streamsInstrumentation,
  type StreamsInstrumentationOptions,
  type StreamsInstrumentationRegistration,
  type StreamsPublishOperation,
  type StreamsSpanAttributeValue,
  type StreamsSpanContext,
  type StreamsSpanLink,
  type StreamsSpanLinkPort,
  type StreamsSpanPort,
  type StreamsTracerPort,
  type StreamsTraceState,
} from './instrumentation.ts';
export type {
  StreamsCounterPort,
  StreamsMeter,
  StreamsMeterPort,
  StreamsMetricAttributeValue,
  StreamsObservableCallback,
  StreamsObservableGaugePort,
  StreamsObservableResultPort,
} from './producer-metrics.ts';
