/**
 * @module @netscript/plugin-streams-core/sse
 *
 * Versioned schemas, parsing, replay state, and native EventSource binding for
 * the durable-stream SSE wire protocol.
 */

export {
  STREAM_SSE_CONSUMER_EVENT_NAMES_V1,
  STREAM_SSE_CONTRACT_V1,
  STREAM_SSE_PROTOCOL_VERSION_V1,
  STREAM_SSE_WIRE_EVENT_NAMES_V1,
} from '../domain/sse-contract-v1.ts';
export type {
  StreamSseChangeHeadersV1,
  StreamSseChangeV1,
  StreamSseConsumerEventNameV1,
  StreamSseConsumerEventV1,
  StreamSseContractV1,
  StreamSseControlPayloadV1,
  StreamSseDataPayloadV1,
  StreamSseErrorCodeV1,
  StreamSseErrorPayloadV1,
  StreamSseHeartbeatPayloadV1,
  StreamSseOffsetV1,
  StreamSseSchemaV1,
  StreamSseWireEventNameV1,
  StreamSseWireFrameV1,
} from '../domain/sse-contract-v1.ts';
export {
  bindStreamEventSourceV1,
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
} from '../application/stream-sse-v1.ts';
export type { Operation } from '../domain/stream-event.ts';
export type {
  StreamSchemaIssue,
  StreamSchemaValidationOptions,
  StreamSchemaValidationResult,
} from '../domain/stream-schema.ts';
export type {
  BindStreamEventSourceOptionsV1,
  StreamEventSourceBindingV1,
  StreamEventSourceV1,
  StreamSseParseInputV1,
  StreamSseParseResultV1,
  StreamSseReductionV1,
  StreamSseReplayStateV1,
} from '../application/stream-sse-v1.ts';
