/**
 * @module
 *
 * Telemetry registration and attributes for NetScript stream operations.
 */

export {
  StreamAttributes,
  type StreamAttributesMap,
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
  type StreamsSpanAttributeValue,
  type StreamsSpanContext,
  type StreamsSpanLink,
  type StreamsSpanLinkPort,
  type StreamsSpanPort,
  type StreamsTracerPort,
  type StreamsTraceState,
} from './instrumentation.ts';
