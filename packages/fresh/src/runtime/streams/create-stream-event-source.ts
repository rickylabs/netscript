/** Fresh/browser construction for the versioned NetScript stream SSE consumer. */

import { isValidStreamOffset } from '@netscript/contracts/streams';
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

/**
 * Options for a schema-validated native stream EventSource consumer.
 *
 * Supply either:
 * - Direct Durable Streams mode: `streamPath` (and optional `baseUrl`), or
 * - Authorizing stream proxy mode: `proxyUrl` (mutually exclusive with `streamPath` and
 *   `baseUrl`), where `options.offset` is the single authoritative starting offset.
 */
export type CreateNetScriptStreamEventSourceOptionsV1 =
  | {
    /** Stream path relative to the NetScript streams service. */
    readonly streamPath: string;
    /** Optional streams service base URL; defaults to NetScript service discovery. */
    readonly baseUrl?: string;
    /** Mutually exclusive with `streamPath` and `baseUrl`. */
    readonly proxyUrl?: never;
    /** Initial opaque replay offset, commonly `-1` for the full retained stream. */
    readonly offset: StreamSseOffsetV1;
    /** Receive validated data/control/heartbeat/error outcomes. */
    readonly onEvent: (event: StreamSseConsumerEventV1) => void;
    /** Optional observed cursor retained for a reconnect controller. */
    readonly lastObservedCursor?: string;
    /** Test or host factory override; defaults to the browser's native `EventSource`. */
    readonly createEventSource?: NetScriptEventSourceFactoryV1;
  }
  | {
    /** Full authorizing stream proxy URL (for example from `buildStreamEndpointUrl`). */
    readonly proxyUrl: string;
    /** Mutually exclusive with `proxyUrl`. */
    readonly streamPath?: never;
    /** Mutually exclusive with `proxyUrl`. */
    readonly baseUrl?: never;
    /** Initial opaque replay offset, commonly `-1` for the full retained stream. */
    readonly offset: StreamSseOffsetV1;
    /** Receive validated data/control/heartbeat/error outcomes. */
    readonly onEvent: (event: StreamSseConsumerEventV1) => void;
    /** Optional observed cursor retained for a reconnect controller. */
    readonly lastObservedCursor?: string;
    /** Test or host factory override; defaults to the browser's native `EventSource`. */
    readonly createEventSource?: NetScriptEventSourceFactoryV1;
  };

/** Native EventSource binding plus the exact URL it consumes. */
export interface NetScriptStreamEventSourceBindingV1 extends StreamEventSourceBindingV1 {
  /** Fully resolved SSE URL including the authoritative opaque starting offset. */
  readonly url: string;
}

function defaultEventSourceFactory(url: string): StreamEventSourceV1 {
  return new EventSource(url);
}

function resolveStreamEventSourceUrl(options: CreateNetScriptStreamEventSourceOptionsV1): URL {
  if (!isValidStreamOffset(options.offset)) {
    throw new TypeError(
      '[netscript.fresh.streams] invalid offset: must satisfy canonical stream offset grammar',
    );
  }

  const hasProxyUrl = options.proxyUrl !== undefined;
  const hasStreamPath = options.streamPath !== undefined;
  const hasBaseUrl = options.baseUrl !== undefined;

  if (hasProxyUrl && (hasStreamPath || hasBaseUrl)) {
    throw new TypeError(
      '[netscript.fresh.streams] proxyUrl cannot be combined with streamPath or baseUrl',
    );
  }
  if (!hasProxyUrl && !hasStreamPath) {
    throw new TypeError(
      '[netscript.fresh.streams] either proxyUrl or streamPath is required',
    );
  }

  if (hasProxyUrl) {
    if (typeof options.proxyUrl !== 'string' || options.proxyUrl.length === 0) {
      throw new TypeError('[netscript.fresh.streams] proxyUrl must be a non-empty http(s) URL');
    }
    const url = new URL(options.proxyUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new TypeError('[netscript.fresh.streams] proxyUrl must be an http(s) URL');
    }
    const existingOffsets = url.searchParams.getAll('offset');
    if (
      existingOffsets.length > 1 ||
      (existingOffsets.length === 1 && existingOffsets[0] !== options.offset)
    ) {
      throw new TypeError(
        '[netscript.fresh.streams] conflicting offset between proxyUrl and options.offset',
      );
    }
    if (existingOffsets.length === 0) {
      url.searchParams.set('offset', options.offset);
    }
    return url;
  }

  const url = new URL(buildStreamUrl(options.streamPath!, options.baseUrl ?? getStreamsUrl()));
  url.searchParams.set('offset', options.offset);
  url.searchParams.set('live', 'sse');
  return url;
}

/**
 * Create a named-event, schema-validated native stream SSE consumer.
 *
 * Native `EventSource` cannot attach arbitrary authorization headers. Pass `proxyUrl` (for
 * example from `buildStreamEndpointUrl`) when targeting a same-origin or cookie-compatible
 * authorizing stream proxy so `options.offset` remains the single authoritative offset without
 * prepending `/v1/stream/netscript` or forcing `live=sse`.
 */
export function createNetScriptStreamEventSourceV1(
  options: CreateNetScriptStreamEventSourceOptionsV1,
): NetScriptStreamEventSourceBindingV1 {
  const url = resolveStreamEventSourceUrl(options);
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
