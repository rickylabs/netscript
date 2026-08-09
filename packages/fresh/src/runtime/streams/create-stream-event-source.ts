/** Fresh/browser construction for the versioned NetScript stream SSE consumer. */

import { buildStreamUrl, getStreamsUrl } from '@netscript/plugin-streams-core';
import {
  bindStreamEventSourceV1,
  createStreamSseReplayStateV1,
  type StreamEventSourceBindingV1,
  type StreamEventSourceV1,
  type StreamSseConsumerEventV1,
  type StreamSseOffsetV1,
} from '@netscript/plugin-streams-core/sse';

/** Factory seam for native `EventSource` construction. */
export type NetScriptEventSourceFactoryV1 = (url: string) => StreamEventSourceV1;

/** Options for a schema-validated native stream EventSource consumer. */
export interface CreateNetScriptStreamEventSourceOptionsV1 {
  /** Stream path relative to the NetScript streams service. */
  readonly streamPath: string;
  /** Initial opaque replay offset, commonly `-1` for the full retained stream. */
  readonly offset: StreamSseOffsetV1;
  /** Receive validated data/control/heartbeat/error outcomes. */
  readonly onEvent: (event: StreamSseConsumerEventV1) => void;
  /** Optional streams service base URL; defaults to NetScript service discovery. */
  readonly baseUrl?: string;
  /** Optional observed cursor retained for a reconnect controller. */
  readonly lastObservedCursor?: string;
  /** Test or host factory override; defaults to the browser's native `EventSource`. */
  readonly createEventSource?: NetScriptEventSourceFactoryV1;
}

/** Native EventSource binding plus the exact same-origin-compatible URL it consumes. */
export interface NetScriptStreamEventSourceBindingV1 extends StreamEventSourceBindingV1 {
  /** Fully resolved `live=sse` URL including the opaque starting offset. */
  readonly url: string;
}

function defaultEventSourceFactory(url: string): StreamEventSourceV1 {
  return new EventSource(url);
}

/**
 * Create a named-event, schema-validated native stream SSE consumer.
 *
 * Native `EventSource` cannot attach arbitrary authorization headers. Use a
 * same-origin route/proxy or another cookie-compatible endpoint when the
 * streams service is protected.
 */
export function createNetScriptStreamEventSourceV1(
  options: CreateNetScriptStreamEventSourceOptionsV1,
): NetScriptStreamEventSourceBindingV1 {
  const url = new URL(buildStreamUrl(options.streamPath, options.baseUrl ?? getStreamsUrl()));
  url.searchParams.set('offset', options.offset);
  url.searchParams.set('live', 'sse');
  const source = (options.createEventSource ?? defaultEventSourceFactory)(url.href);
  const binding = bindStreamEventSourceV1({
    source,
    onEvent: options.onEvent,
    initialState: createStreamSseReplayStateV1({
      lastCommittedOffset: options.offset,
      lastObservedCursor: options.lastObservedCursor,
    }),
  });
  return { ...binding, url: url.href };
}
