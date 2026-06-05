/** Span names emitted by stream producers and consumers. */
export const STREAMS_SPAN_NAMES = [
  'stream.publish',
  'stream.consume',
  'stream.subscribe',
] as const;

/** Span name emitted by stream instrumentation. */
export type StreamsSpanName = typeof STREAMS_SPAN_NAMES[number];

/** Attribute keys used by stream telemetry. */
export const STREAMS_TELEMETRY_ATTRIBUTES = [
  'stream.path',
  'stream.collection',
  'stream.operation',
  'stream.producer_id',
  'stream.offset',
] as const;

/** Attribute key used by stream telemetry. */
export type StreamsTelemetryAttributeKey = typeof STREAMS_TELEMETRY_ATTRIBUTES[number];

/** Attribute bag accepted by stream instrumentation hooks. */
export type StreamsTelemetryAttributes = Partial<
  Record<StreamsTelemetryAttributeKey, string | number | boolean>
>;
