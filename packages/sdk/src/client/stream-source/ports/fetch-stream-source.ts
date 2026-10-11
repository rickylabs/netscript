import type { StreamEventSourceV1 } from '@netscript/plugin-streams-core/sse';

/** Streaming response subset used by the consumer; excludes host-only Response methods. */
export type StreamFetchResponseV1 = Pick<Response, 'ok' | 'status' | 'headers' | 'body'>;

/** WHATWG streaming fetch supplied by the host. Verify host-specific request types through a wrapper. */
export type StreamFetchV1 = (url: string, init: RequestInit) => Promise<StreamFetchResponseV1>;

/** Timer port for heartbeat deadlines and reconnect delays; tests can advance it manually. */
export interface StreamSourceSchedulerV1 {
  /** Schedule once and return an idempotent cancellation function. */
  schedule(callback: () => void, delayMs: number): () => void;
}

/** Configuration for a DOM-independent durable-stream fetch source. */
export interface FetchStreamEventSourceOptionsV1 {
  /** Full stream URL; `live=sse` is set and the existing `offset` is preserved until control. */
  readonly url: string | URL;
  /** Host-owned streaming fetch; never defaults to a global transport. */
  readonly fetch: StreamFetchV1;
  /** Stop connecting, reading, and retrying when aborted. */
  readonly signal?: AbortSignal;
  /** Sync or async credentials, resolved afresh on every connection with its abort signal. */
  readonly authHeaders?: (signal: AbortSignal) => HeadersInit | Promise<HeadersInit>;
  /** Maximum silence during auth, connection, or reading; defaults to 30,000 ms. */
  readonly heartbeatTimeoutMs?: number;
  /** Initial reconnect delay; defaults to 1,000 ms. Server `retry:` values replace it, clamped between this configured floor and the cap. */
  readonly reconnectDelayMs?: number;
  /** Hard reconnect cap; defaults to 30,000 ms. */
  readonly maxReconnectDelayMs?: number;
  /** Bound in characters for framing and separately for uncommitted data; defaults to 1 MiB. */
  readonly maxBufferSize?: number;
  /** Maximum data frames awaiting a committing control; defaults to 1,024. */
  readonly maxPendingEvents?: number;
  /** Initial Last-Event-ID, retained verbatim until the next committed frame. */
  readonly lastEventId?: string;
  /** Host timer override; defaults to `setTimeout` / `clearTimeout`. */
  readonly scheduler?: StreamSourceSchedulerV1;
}

/** Existing stream-source port with an awaitable resource shutdown. */
export interface FetchStreamEventSourceV1 extends StreamEventSourceV1 {
  /** Resolves after close, abort, HTTP 204, or a terminal control has released resources. */
  readonly done: Promise<void>;
}
