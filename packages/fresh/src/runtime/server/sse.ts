/**
 * Server-Sent Events (SSE) Utilities for Fresh
 *
 * Provides reusable utilities for creating SSE streams with:
 * - Type-safe event emission
 * - Automatic keepalive
 * - Graceful cleanup
 * - KV watch integration
 *
 * @module
 */

import { getKv } from '@netscript/kv';

// ============================================================================
// TYPES
// ============================================================================

/**
 * KV key shape accepted by SSE watch helpers.
 */
export type SSEKvKey = readonly Deno.KvKeyPart[];

/** Timer identifier returned by the active runtime's interval scheduler. */
export type SSEIntervalId = ReturnType<typeof setInterval>;

/**
 * Clock port used by the SSE adapter for heartbeat and timestamp behavior.
 */
export interface SSEClock {
  /** Schedule repeated heartbeat work. */
  setInterval(callback: () => void, ms: number): SSEIntervalId;
  /** Clear a scheduled heartbeat. */
  clearInterval(id: SSEIntervalId): void;
  /** Return the current timestamp for emitted events. */
  now(): Date;
}

/** KV watch surface consumed by the SSE helpers. */
export interface SSEWatchableKv {
  /** Watch a fixed list of KV keys. */
  watch(
    keys: SSEKvKey[],
    options: { signal?: AbortSignal; debounce?: number },
  ): AsyncIterable<unknown[]>;
  /** Watch all changes below a KV key prefix. */
  watchPrefix(
    prefix: SSEKvKey,
    options: { signal?: AbortSignal; pollInterval?: number },
  ): AsyncIterable<unknown>;
  /** Optional list method used by callers when fetching initial state. */
  list?(selector: { prefix: SSEKvKey }, options?: unknown): AsyncIterable<unknown>;
}

const SYSTEM_SSE_CLOCK: SSEClock = {
  setInterval(callback, ms) {
    return setInterval(callback, ms);
  },
  clearInterval(id) {
    clearInterval(id);
  },
  now() {
    return new Date();
  },
};

/**
 * SSE event to send to clients
 */
export interface SSEEvent<T = unknown> {
  /** Event name (used in addEventListener on client) */
  event: string;
  /** Event data (will be JSON serialized) */
  data: T;
  /** Optional event ID for reconnection */
  id?: string;
  /** Optional retry interval in ms */
  retry?: number;
}

/**
 * SSE stream options
 */
export interface SSEStreamOptions {
  /** Keepalive interval in ms (default: 15000) */
  keepaliveInterval?: number;
  /** Whether to send initial connected event (default: true) */
  sendConnected?: boolean;
  /** Abort signal from the request or caller that owns this stream. */
  signal?: AbortSignal;
  /** Clock port for heartbeat scheduling and timestamps. */
  clock?: SSEClock;
  /** Custom headers to include */
  headers?: Record<string, string>;
}

/**
 * SSE stream controller for sending events
 */
export interface SSEController {
  /** Send an event to the client */
  send<T>(event: SSEEvent<T>): void;
  /** Send a named event with data */
  emit<T>(eventName: string, data: T): void;
  /** Check if the stream is still open */
  readonly isOpen: boolean;
  /** Close the stream */
  close(): void;
}

/**
 * SSE stream handler function
 */
export type SSEHandler = (
  controller: SSEController,
  signal: AbortSignal,
) => Promise<void> | void;

// ============================================================================
// SSE STREAM CREATION
// ============================================================================

/**
 * Create an SSE Response with a handler function.
 *
 * @param handler - Async function that receives the controller and abort signal
 * @param options - Stream options
 * @returns Response with SSE stream
 *
 * @example
 * ```ts
 * export const handler = define.handlers({
 *   GET() {
 *     return createSSEStream(async (sse, signal) => {
 *       // Send initial data
 *       sse.emit('data', { items: [] });
 *
 *       // Watch for changes
 *       const kv = await getKv();
 *       for await (const event of kv.watchPrefix(['items'], { signal })) {
 *         sse.emit('update', event);
 *       }
 *     });
 *   },
 * });
 * ```
 */
export function createSSEStream(
  handler: SSEHandler,
  options: SSEStreamOptions = {},
): Response {
  const {
    keepaliveInterval = 15000,
    sendConnected = true,
    signal: externalSignal,
    clock = SYSTEM_SSE_CLOCK,
    headers: customHeaders = {},
  } = options;

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
    ...customHeaders,
  });

  const abortController = new AbortController();
  let closed = false;
  let keepaliveTimer: SSEIntervalId | null = null;

  const disposeKeepalive = (): void => {
    if (keepaliveTimer !== null) {
      clock.clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
  };

  const stream = new ReadableStream({
    async start(streamController) {
      const encoder = new TextEncoder();
      let onExternalAbort: (() => void) | undefined;

      // Create SSE controller
      const sseController: SSEController = {
        send<T>(event: SSEEvent<T>): void {
          if (closed) return;

          try {
            let message = '';

            if (event.id) {
              message += `id: ${event.id}\n`;
            }

            if (event.retry) {
              message += `retry: ${event.retry}\n`;
            }

            message += `event: ${event.event}\n`;
            message += `data: ${JSON.stringify(event.data)}\n\n`;

            streamController.enqueue(encoder.encode(message));
          } catch {
            this.close();
          }
        },

        emit<T>(eventName: string, data: T): void {
          this.send({ event: eventName, data });
        },

        get isOpen(): boolean {
          return !closed;
        },

        close(): void {
          if (closed) return;
          closed = true;
          abortController.abort();
          disposeKeepalive();
          if (onExternalAbort) {
            externalSignal?.removeEventListener('abort', onExternalAbort);
          }

          try {
            streamController.close();
          } catch {
            // Already closed
          }
        },
      };

      if (externalSignal) {
        onExternalAbort = () => sseController.close();
        if (externalSignal.aborted) {
          onExternalAbort();
        } else {
          externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
      }

      // Send connected event
      if (sendConnected) {
        sseController.emit('connected', {
          message: 'SSE connection established',
          timestamp: clock.now().toISOString(),
        });
      }

      // Start keepalive
      keepaliveTimer = clock.setInterval(() => {
        if (closed) {
          disposeKeepalive();
          return;
        }

        try {
          streamController.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          sseController.close();
        }
      }, keepaliveInterval);

      // Run handler
      try {
        await handler(sseController, abortController.signal);
      } catch (error) {
        if (!closed && !(error instanceof Error && error.name === 'AbortError')) {
          sseController.emit('error', {
            message: error instanceof Error ? error.message : String(error),
            timestamp: clock.now().toISOString(),
          });
        }
      } finally {
        sseController.close();
      }
    },

    cancel() {
      closed = true;
      abortController.abort();
      disposeKeepalive();
    },
  });

  return new Response(stream, { headers });
}

// ============================================================================
// KV WATCH HELPERS
// ============================================================================

/**
 * Options for KV watch SSE stream
 */
export interface KvWatchSSEOptions<T> extends SSEStreamOptions {
  /** KV instance to use (uses shared if not provided) */
  kv?: SSEWatchableKv;
  /** Function to fetch initial data */
  fetchInitial?: (kv: SSEWatchableKv) => Promise<T>;
  /** Event name for initial data (default: 'initial') */
  initialEventName?: string;
  /** Event name for updates (default: 'update') */
  updateEventName?: string;
  /** Transform function for watch events */
  transform?: (event: unknown) => unknown;
  /** Debounce interval in ms */
  debounce?: number;
}

/**
 * Create an SSE stream that watches KV keys for changes.
 *
 * @param keys - KV keys to watch
 * @param options - Watch options
 * @returns Response with SSE stream
 *
 * @example
 * ```ts
 * export const handler = define.handlers({
 *   GET() {
 *     return createKvWatchSSE(
 *       [['executions']],
 *       {
 *         fetchInitial: async (kv) => {
 *           const items = [];
 *           for await (const entry of kv.list({ prefix: ['executions'] })) {
 *             items.push(entry.value);
 *           }
 *           return { items };
 *         },
 *       }
 *     );
 *   },
 * });
 * ```
 */
export function createKvWatchSSE<T = unknown>(
  keys: SSEKvKey[],
  options: KvWatchSSEOptions<T> = {},
): Response {
  const {
    kv: explicitKv,
    fetchInitial,
    initialEventName = 'initial',
    updateEventName = 'update',
    transform,
    debounce,
    ...sseOptions
  } = options;

  return createSSEStream(async (sse, signal) => {
    const kv = explicitKv ?? await getKv() as SSEWatchableKv;

    // Fetch and send initial data
    if (fetchInitial) {
      try {
        const initialData = await fetchInitial(kv);
        sse.emit(initialEventName, {
          data: initialData,
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      } catch {
        sse.emit('error', {
          message: 'Failed to fetch initial data',
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      }
    }

    // Watch for changes
    try {
      for await (const events of kv.watch(keys, { signal, debounce })) {
        if (!sse.isOpen) break;

        const transformedEvents = transform ? events.map(transform) : events;

        sse.emit(updateEventName, {
          events: transformedEvents,
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        throw error;
      }
    }
  }, sseOptions);
}

/**
 * Create an SSE stream that watches a KV prefix for changes.
 *
 * @param prefix - KV prefix to watch
 * @param options - Watch options
 * @returns Response with SSE stream
 *
 * @example
 * ```ts
 * export const handler = define.handlers({
 *   GET() {
 *     return createKvPrefixWatchSSE(['executions'], {
 *       fetchInitial: async (kv) => {
 *         const items = [];
 *         for await (const entry of kv.list({ prefix: ['executions'] })) {
 *           items.push(entry.value);
 *         }
 *         return { items };
 *       },
 *     });
 *   },
 * });
 * ```
 */
export function createKvPrefixWatchSSE<T = unknown>(
  prefix: SSEKvKey,
  options: KvWatchSSEOptions<T> & { pollInterval?: number } = {},
): Response {
  const {
    kv: explicitKv,
    fetchInitial,
    initialEventName = 'initial',
    updateEventName = 'update',
    transform,
    pollInterval,
    ...sseOptions
  } = options;

  return createSSEStream(async (sse, signal) => {
    const kv = explicitKv ?? await getKv() as SSEWatchableKv;

    // Fetch and send initial data
    if (fetchInitial) {
      try {
        const initialData = await fetchInitial(kv);
        sse.emit(initialEventName, {
          data: initialData,
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      } catch {
        sse.emit('error', {
          message: 'Failed to fetch initial data',
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      }
    }

    // Watch prefix for changes
    try {
      for await (const event of kv.watchPrefix(prefix, { signal, pollInterval })) {
        if (!sse.isOpen) break;

        const transformedEvent = transform ? transform(event) : event;

        sse.emit(updateEventName, {
          event: transformedEvent,
          timestamp: sseOptions.clock?.now().toISOString() ?? SYSTEM_SSE_CLOCK.now().toISOString(),
        });
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        throw error;
      }
    }
  }, sseOptions);
}
