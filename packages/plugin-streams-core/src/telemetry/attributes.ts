/** Span names emitted by stream producers and consumers. */
export type StreamSpanNamesMap = Readonly<{
  PUBLISH: 'stream.publish';
  CONSUME: 'stream.consume';
  SUBSCRIBE: 'stream.subscribe';
}>;

/** Span names emitted by stream producers and consumers. */
export const StreamSpanNames: StreamSpanNamesMap = {
  PUBLISH: 'stream.publish',
  CONSUME: 'stream.consume',
  SUBSCRIBE: 'stream.subscribe',
};

/** Attribute keys used by stream telemetry. */
export type StreamAttributesMap = Readonly<{
  SYSTEM: 'messaging.system';
  DESTINATION_NAME: 'messaging.destination.name';
  OPERATION_NAME: 'messaging.operation.name';
  OPERATION_TYPE: 'messaging.operation.type';
  MESSAGE_ID: 'messaging.message.id';
  MESSAGE_CONVERSATION_ID: 'messaging.message.conversation_id';
  DESTINATION_KIND: 'netscript.messaging.destination.kind';
  CORRELATION_ID: 'netscript.correlation.id';
  STREAM_PATH: 'netscript.stream.path';
  COLLECTION: 'netscript.stream.collection';
  PRODUCER_ID: 'netscript.stream.producer.id';
  OUTCOME: 'netscript.outcome';
}>;

/** Attribute keys used by stream telemetry. */
export const StreamAttributes: StreamAttributesMap = {
  SYSTEM: 'messaging.system',
  DESTINATION_NAME: 'messaging.destination.name',
  OPERATION_NAME: 'messaging.operation.name',
  OPERATION_TYPE: 'messaging.operation.type',
  MESSAGE_ID: 'messaging.message.id',
  MESSAGE_CONVERSATION_ID: 'messaging.message.conversation_id',
  DESTINATION_KIND: 'netscript.messaging.destination.kind',
  CORRELATION_ID: 'netscript.correlation.id',
  STREAM_PATH: 'netscript.stream.path',
  COLLECTION: 'netscript.stream.collection',
  PRODUCER_ID: 'netscript.stream.producer.id',
  OUTCOME: 'netscript.outcome',
};

/** Span name emitted by stream instrumentation. */
export type StreamsSpanName = (typeof StreamSpanNames)[keyof typeof StreamSpanNames];

/** Attribute key used by stream telemetry. */
export type StreamsTelemetryAttributeKey = (typeof StreamAttributes)[keyof typeof StreamAttributes];

/** Attribute bag accepted by stream instrumentation hooks. */
export type StreamsTelemetryAttributes = Partial<
  Record<StreamsTelemetryAttributeKey, string | number | boolean>
>;
