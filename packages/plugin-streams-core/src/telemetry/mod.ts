/**
 * @module
 *
 * Telemetry registration and attributes for NetScript stream operations.
 */

export {
  STREAMS_SPAN_NAMES,
  STREAMS_TELEMETRY_ATTRIBUTES,
  type StreamsSpanName,
  type StreamsTelemetryAttributeKey,
  type StreamsTelemetryAttributes,
} from './attributes.ts';
export {
  streamsInstrumentation,
  type StreamsInstrumentationRegistration,
} from './instrumentation.ts';
