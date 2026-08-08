import {
  STREAM_SSE_CONTRACT_V1,
  type StreamSseConsumerEventV1,
  type StreamSseControlPayloadV1,
  type StreamSseDataPayloadV1,
  type StreamSseErrorPayloadV1,
  type StreamSseOffsetV1,
  type StreamSseWireFrameV1,
} from '../domain/sse-contract-v1.ts';

/** Input accepted by the v1 named-event frame parser. */
export interface StreamSseParseInputV1 {
  /** SSE event name supplied by `addEventListener`. */
  readonly eventName: string;
  /** JSON text from `MessageEvent.data`. */
  readonly data: string;
  /** Last committed opaque offset included in a normalized error. */
  readonly lastCommittedOffset?: StreamSseOffsetV1;
}

/** Result of parsing and validating one named SSE frame. */
export type StreamSseParseResultV1 =
  | Readonly<{ ok: true; frame: StreamSseWireFrameV1 }>
  | Readonly<{ ok: false; error: StreamSseErrorPayloadV1 }>;

/** Replay snapshot consumed by reconnect policy without owning that policy. */
export interface StreamSseReplayStateV1 {
  /** Last control-committed opaque offset. Store verbatim; never parse or increment. */
  readonly lastCommittedOffset?: StreamSseOffsetV1;
  /** Last server cursor observed on a valid control frame. */
  readonly lastObservedCursor?: string;
  /** Whether the last valid control marked the stream terminal. */
  readonly streamClosed: boolean;
  /** Wire-ordered data batches awaiting their committing control frame. */
  readonly pendingBatches: readonly StreamSseDataPayloadV1[];
}

/** Result of applying a valid frame to replay state. */
export interface StreamSseReductionV1 {
  /** Next immutable replay snapshot. */
  readonly state: StreamSseReplayStateV1;
  /** Validated consumer outcome derived from the frame. */
  readonly event: StreamSseConsumerEventV1;
}

/** Create an empty or caller-seeded v1 replay snapshot. */
export function createStreamSseReplayStateV1(
  initial: Readonly<{
    lastCommittedOffset?: StreamSseOffsetV1;
    lastObservedCursor?: string;
    streamClosed?: boolean;
  }> = {},
): StreamSseReplayStateV1 {
  return {
    lastCommittedOffset: initial.lastCommittedOffset,
    lastObservedCursor: initial.lastObservedCursor,
    streamClosed: initial.streamClosed ?? false,
    pendingBatches: [],
  };
}

function parseFailure(
  input: StreamSseParseInputV1,
  code: 'malformed-frame' | 'unsupported-event',
  message: string,
): StreamSseParseResultV1 {
  return {
    ok: false,
    error: {
      code,
      eventName: input.eventName,
      message,
      retryable: false,
      lastCommittedOffset: input.lastCommittedOffset,
    },
  };
}

/** Parse a named SSE frame through the single v1 contract authority. */
export function parseStreamSseEventV1(
  input: StreamSseParseInputV1,
): StreamSseParseResultV1 {
  if (input.eventName !== 'data' && input.eventName !== 'control') {
    return parseFailure(input, 'unsupported-event', `Unsupported SSE event: ${input.eventName}`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(input.data);
  } catch {
    return parseFailure(input, 'malformed-frame', `Invalid JSON in ${input.eventName} frame`);
  }

  if (input.eventName === 'data') {
    const result = STREAM_SSE_CONTRACT_V1.schemas.data['~standard'].validate(payload);
    return 'value' in result
      ? { ok: true, frame: { event: 'data', payload: result.value } }
      : parseFailure(input, 'malformed-frame', 'Data frame failed the v1 schema');
  }

  const result = STREAM_SSE_CONTRACT_V1.schemas.control['~standard'].validate(payload);
  return 'value' in result
    ? { ok: true, frame: { event: 'control', payload: result.value } }
    : parseFailure(input, 'malformed-frame', 'Control frame failed the v1 schema');
}

function isHeartbeat(
  payload: StreamSseControlPayloadV1,
  hadPendingData: boolean,
): payload is StreamSseControlPayloadV1 & {
  readonly upToDate: true;
  readonly streamClosed?: false;
} {
  return !hadPendingData && payload.upToDate === true && payload.streamClosed !== true;
}

/** Apply one valid frame while committing replay progress only on a control frame. */
export function reduceStreamSseReplayStateV1(
  state: StreamSseReplayStateV1,
  frame: StreamSseWireFrameV1,
): StreamSseReductionV1 {
  if (frame.event === 'data') {
    return {
      state: { ...state, pendingBatches: [...state.pendingBatches, frame.payload] },
      event: frame,
    };
  }

  const hadPendingData = state.pendingBatches.length > 0;
  const nextState: StreamSseReplayStateV1 = {
    lastCommittedOffset: frame.payload.streamNextOffset,
    lastObservedCursor: frame.payload.streamCursor ?? state.lastObservedCursor,
    streamClosed: frame.payload.streamClosed ?? false,
    pendingBatches: [],
  };
  return {
    state: nextState,
    event: isHeartbeat(frame.payload, hadPendingData)
      ? { event: 'heartbeat', payload: frame.payload }
      : frame,
  };
}

/** Minimal native EventSource surface used at the browser edge and in tests. */
export interface StreamEventSourceV1 {
  /** Register a named SSE or transport listener. */
  addEventListener(type: string, listener: EventListener): void;
  /** Remove a previously registered listener. */
  removeEventListener(type: string, listener: EventListener): void;
  /** Close the underlying connection. */
  close(): void;
}

/** Options for binding a native EventSource to the v1 contract. */
export interface BindStreamEventSourceOptionsV1 {
  /** Native EventSource or compatible test seam. */
  readonly source: StreamEventSourceV1;
  /** Validated event receiver. */
  readonly onEvent: (event: StreamSseConsumerEventV1) => void;
  /** Optional reconnect snapshot seed. */
  readonly initialState?: StreamSseReplayStateV1;
}

/** Disposable browser binding and immutable replay snapshot accessor. */
export interface StreamEventSourceBindingV1 {
  /** Read the current replay snapshot. */
  readonly snapshot: () => StreamSseReplayStateV1;
  /** Remove listeners and close the EventSource. */
  readonly dispose: () => void;
}

/** Bind named `data` and `control` listeners using schema-validated v1 outcomes. */
export function bindStreamEventSourceV1(
  options: BindStreamEventSourceOptionsV1,
): StreamEventSourceBindingV1 {
  let state = options.initialState ?? createStreamSseReplayStateV1();

  const receive = (eventName: 'data' | 'control') => (event: Event): void => {
    const data = event instanceof MessageEvent && typeof event.data === 'string' ? event.data : '';
    const result = parseStreamSseEventV1({
      eventName,
      data,
      lastCommittedOffset: state.lastCommittedOffset,
    });
    if (!result.ok) {
      options.onEvent({ event: 'error', payload: result.error });
      return;
    }
    const reduction = reduceStreamSseReplayStateV1(state, result.frame);
    state = reduction.state;
    options.onEvent(reduction.event);
  };

  const onData = receive('data');
  const onControl = receive('control');
  const onError = (_event: Event): void => {
    options.onEvent({
      event: 'error',
      payload: {
        code: 'transport-error',
        eventName: 'error',
        message: 'EventSource transport error',
        retryable: true,
        lastCommittedOffset: state.lastCommittedOffset,
      },
    });
  };

  options.source.addEventListener('data', onData);
  options.source.addEventListener('control', onControl);
  options.source.addEventListener('error', onError);

  return {
    snapshot: (): StreamSseReplayStateV1 => state,
    dispose: (): void => {
      options.source.removeEventListener('data', onData);
      options.source.removeEventListener('control', onControl);
      options.source.removeEventListener('error', onError);
      options.source.close();
    },
  };
}
