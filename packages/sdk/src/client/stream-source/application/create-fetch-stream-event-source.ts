import type {
  FetchStreamEventSourceOptionsV1,
  FetchStreamEventSourceV1,
} from '../ports/fetch-stream-source.ts';
import { resolveStreamSourceSettings } from '../internal/settings.ts';
import { FetchStreamSource } from './fetch-stream-source.ts';

/**
 * Create a reconnecting durable-stream source using a host-injected streaming fetch.
 *
 * Bind it with `bindStreamEventSourceV1` unchanged. Events are plain objects; no Event,
 * MessageEvent, EventTarget, or EventSource constructor is used. Data frames are buffered
 * until a schema-valid control commits their opaque `offset`, so a disconnect before control
 * replays the undelivered batch. SSE `Last-Event-ID` is also sent on reconnect when nonempty.
 * A server must honor its replay cursor; this transport does not deduplicate arbitrary logs.
 *
 * Every connection resolves credentials anew and has a byte-silence deadline. Consecutive
 * failures double the delay up to the cap; valid control progress resets it. Every non-2xx
 * response retries, including 401/403/404, so callers must abort persistent failures. HTTP 204
 * and terminal control stop permanently. Server `retry:` changes the delay, clamped between
 * the configured initial back-off floor and cap. Close/abort discards uncommitted data,
 * cancels timers and the response reader, and prevents further listeners or reconnects.
 * Listener exceptions terminate the source and reject `done` instead of replaying callbacks.
 *
 * @param options Full stream URL, fetch port, auth provider, cancellation, and optional limits.
 * @returns An EventSource-compatible handle. Attach listeners synchronously; await `done` for shutdown.
 * @example
 * ```ts
 * import { bindStreamEventSourceV1, createFetchStreamEventSourceV1 } from '@netscript/sdk/streams/consumer';
 *
 * const abort = new AbortController();
 * const source = createFetchStreamEventSourceV1({
 *   url: 'https://api.example.com/v1/stream/netscript/workers/executions?offset=-1',
 *   fetch: (url, init) => fetch(url, init), // Replace with the host's streaming fetch.
 *   signal: abort.signal,
 *   authHeaders: () => ({ authorization: 'Bearer example-token' }),
 * });
 * const binding = bindStreamEventSourceV1({ source, onEvent: (event) => console.log(event) });
 * binding.dispose();
 * await source.done;
 * ```
 */
export function createFetchStreamEventSourceV1(
  options: FetchStreamEventSourceOptionsV1,
): FetchStreamEventSourceV1 {
  return new FetchStreamSource(options, resolveStreamSourceSettings(options));
}
