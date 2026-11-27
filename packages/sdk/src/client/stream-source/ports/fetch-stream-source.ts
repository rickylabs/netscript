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

/** Diagnostic metadata observed on a non-2xx (non-204) HTTP response from a fetch stream source. */
export interface FetchStreamHttpErrorInfoV1 {
  /** Numeric HTTP status code returned by the stream endpoint (e.g. 401, 403, 404, 410, 503). */
  readonly status: number;
  /** Raw `Retry-After` response header value when present. */
  readonly retryAfter?: string;
  /** `true` when `status` matched `options.terminalStatuses` and the source closed; `false` when it will retry. */
  readonly terminal: boolean;
  /**
   * Most recent `streamNextOffset` committed by a schema-valid `control` frame on this source,
   * or `undefined` if no `control` frame has committed yet.
   */
  readonly lastCommittedOffset?: string;
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
  /**
   * Declarative opt-in list of non-2xx HTTP status codes that close the source permanently
   * instead of retrying (recommended for authorizing proxies: `[400, 401, 403, 404, 405, 410]`).
   * Omission preserves the shipped retry-all non-2xx behavior.
   */
  readonly terminalStatuses?: readonly number[];
  /**
   * Optional pure synchronous observer invoked on every non-2xx (non-204) HTTP response after
   * cancelling the response body and before dispatching the `'error'` event. Returns `void`;
   * stopping is decided declaratively by `terminalStatuses` (or imperatively via `source.close()`
   * / aborting `options.signal`). An uncaught throw closes the source (`readyState = 2`) and
   * rejects `done`, matching listener exceptions.
   */
  readonly onHttpError?: (info: FetchStreamHttpErrorInfoV1) => void;
}

/** Existing stream-source port with an awaitable resource shutdown and EventSource readyState. */
export interface FetchStreamEventSourceV1 extends StreamEventSourceV1 {
  /** WHATWG EventSource-compatible connection state (`0` = CONNECTING, `1` = OPEN, `2` = CLOSED). */
  readonly readyState: 0 | 1 | 2;
  /** Resolves after close, abort, HTTP 204, terminal status, or terminal control has released resources. */
  readonly done: Promise<void>;
}
