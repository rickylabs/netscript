import { assert, assertEquals } from '@std/assert';
import {
  createKvWatchSSE,
  createSSEStream,
  type SSEClock,
  type SSEKvKey,
  type SSEWatchableKv,
} from './sse.ts';

function waitForMicrotask(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function neverIterable<T>(): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      return {
        next() {
          return new Promise<IteratorResult<T>>(() => undefined);
        },
      };
    },
  };
}

Deno.test('createSSEStream clears heartbeat when the external signal aborts', async () => {
  const controller = new AbortController();
  let clearedInterval: number | undefined;

  const clock: SSEClock = {
    setInterval() {
      return 42;
    },
    clearInterval(id) {
      clearedInterval = id;
    },
    now() {
      return new Date('2026-06-13T00:00:00.000Z');
    },
  };

  const response = createSSEStream((_sse, signal) => {
    return new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve(), { once: true });
    });
  }, {
    clock,
    keepaliveInterval: 10,
    signal: controller.signal,
  });

  const reader = response.body?.getReader();
  assert(reader);
  controller.abort();
  await waitForMicrotask();

  assertEquals(clearedInterval, 42);
  await reader.cancel();
});

Deno.test('createKvWatchSSE aborts the KV watch when the response body is canceled', async () => {
  let watchSignal: AbortSignal | undefined;
  let watchAborted = false;

  const kv: SSEWatchableKv = {
    watch(_keys: SSEKvKey[], options: { signal?: AbortSignal }) {
      watchSignal = options.signal;
      options.signal?.addEventListener('abort', () => {
        watchAborted = true;
      }, { once: true });

      return neverIterable<unknown[]>();
    },
    watchPrefix() {
      return neverIterable<unknown>();
    },
  };

  const response = createKvWatchSSE([['items']], {
    kv,
    sendConnected: false,
  });

  const reader = response.body?.getReader();
  assert(reader);
  await waitForMicrotask();
  assert(watchSignal);

  await reader.cancel();
  await waitForMicrotask();

  assertEquals(watchAborted, true);
});
