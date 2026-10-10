/**
 * DOM-independent durable-stream consumer for a host-injected streaming fetch.
 *
 * Import this subpath in shared/browser/React Native code. The wider SDK streams
 * facade also exports server producers and their telemetry dependencies.
 * The source emits plain events through the versioned stream-core SSE binding.
 *
 * @example
 * ```ts
 * import { bindStreamEventSourceV1, createFetchStreamEventSourceV1 } from '@netscript/sdk/streams/consumer';
 * const source = createFetchStreamEventSourceV1({
 *   url: 'https://api.example.com/v1/stream/netscript/tasks?offset=-1',
 *   fetch: (url, init) => fetch(url, init),
 * });
 * const binding = bindStreamEventSourceV1({ source, onEvent: (event) => console.log(event) });
 * binding.dispose();
 * await source.done;
 * ```
 *
 * @module
 */
export { createFetchStreamEventSourceV1 } from './application/create-fetch-stream-event-source.ts';
export type {
  FetchStreamEventSourceOptionsV1,
  FetchStreamEventSourceV1,
  StreamFetchResponseV1,
  StreamFetchV1,
  StreamSourceSchedulerV1,
} from './ports/fetch-stream-source.ts';
export { bindStreamEventSourceV1 } from '@netscript/plugin-streams-core/sse';
export type * from '@netscript/plugin-streams-core/sse';
