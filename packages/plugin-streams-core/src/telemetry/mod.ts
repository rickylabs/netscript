/**
 * @module
 *
 * Telemetry registration and attributes for NetScript stream operations.
 */

export {
  StreamAttributes,
  StreamSpanNames,
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
} from './instrumentation.ts';
