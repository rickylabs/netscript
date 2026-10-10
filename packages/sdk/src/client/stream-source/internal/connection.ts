import type { StreamSourceSchedulerV1 } from '../ports/fetch-stream-source.ts';
import type { SseBlock } from './sse-parser.ts';
import { SseParser } from './sse-parser.ts';

/** Await injected IO while releasing the abort listener on every settlement. */
export async function untilAborted<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    // Injected IO can abort synchronously while returning a rejected promise.
    // Observe that promise even when cancellation wins before the race is installed.
    void operation.catch(() => {});
    throw signal.reason;
  }
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
  });
  try {
    return await Promise.race([operation, cancelled]);
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

/** Connection-scoped silence deadline, reset only by received bytes. */
export function createHeartbeatDeadline(
  scheduler: StreamSourceSchedulerV1,
  timeout: number,
  controller: AbortController,
): { touch(): void; dispose(): void } {
  let cancel: () => void = () => {};
  return {
    touch() {
      cancel();
      cancel = scheduler.schedule(
        () => controller.abort(new Error('Stream heartbeat deadline exceeded')),
        timeout,
      );
    },
    dispose() {
      cancel();
    },
  };
}

/** Read bounded UTF-8 slices without flushing incomplete SSE blocks at disconnect. */
export async function readSseConnection(options: {
  response: Response;
  signal: AbortSignal;
  bufferLimit: number;
  lastEventId: string;
  onBytes: () => void;
  onBlock: (block: SseBlock) => void;
  onRetry: (delay: number) => void;
}): Promise<void> {
  if (
    !options.response.ok || !options.response.body ||
    options.response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
      'text/event-stream'
  ) {
    await options.response.body?.cancel();
    throw new Error('Expected a successful streaming text/event-stream response');
  }
  const reader = options.response.body.getReader();
  const cancelReader = (): void => {
    void reader.cancel().catch(() => {});
  };
  options.signal.addEventListener('abort', cancelReader, { once: true });
  const decoder = new TextDecoder();
  const parser = new SseParser(
    options.bufferLimit,
    options.lastEventId,
    options.onBlock,
    options.onRetry,
  );
  try {
    while (!options.signal.aborted) {
      const { value, done } = await reader.read();
      if (done) return;
      if (value.byteLength === 0) continue;
      options.onBytes();
      // Bound transient decoding even when an injected fetch supplies a very large chunk.
      for (let start = 0; start < value.byteLength && !options.signal.aborted; start += 16_384) {
        parser.feed(decoder.decode(value.subarray(start, start + 16_384), { stream: true }));
      }
    }
  } finally {
    options.signal.removeEventListener('abort', cancelReader);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
