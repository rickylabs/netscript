import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { AiRateLimitError, withRetryingChatClient, withRetryingEmbeddingProvider } from '../mod.ts';
import type { ChatClientPort, EmbeddingProviderPort } from '../src/ports/mod.ts';

function rateLimit(retryAfter?: string): Error & { status: number; headers: Headers } {
  return Object.assign(new Error('limited'), {
    status: 429,
    headers: new Headers(retryAfter === undefined ? {} : { 'retry-after': retryAfter }),
  });
}

Deno.test('embedding retry honors Retry-After before succeeding', async () => {
  let calls = 0;
  const delays: number[] = [];
  const provider: EmbeddingProviderPort = {
    embed() {
      calls++;
      if (calls === 1) return Promise.reject(rateLimit('2'));
      return Promise.resolve({ embeddings: [[1]], model: 'test' });
    },
  };

  const wrapped = withRetryingEmbeddingProvider(provider, {
    maxAttempts: 2,
    maxDelayMs: 5_000,
    sleep(delay) {
      delays.push(delay);
      return Promise.resolve();
    },
  });

  assertEquals(await wrapped.embed('hello'), { embeddings: [[1]], model: 'test' });
  assertEquals(delays, [2_000]);
  assertEquals(calls, 2);
});

Deno.test('full-jitter exponential backoff stays within each attempt cap', async () => {
  let calls = 0;
  const delays: number[] = [];
  const provider: EmbeddingProviderPort = {
    embed() {
      calls++;
      return calls < 3
        ? Promise.reject(rateLimit())
        : Promise.resolve({ embeddings: [[1]], model: 'test' });
    },
  };
  const randomValues = [0.25, 0.75];
  const wrapped = withRetryingEmbeddingProvider(provider, {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1_000,
    factor: 2,
    random: () => randomValues.shift() ?? 0,
    sleep(delay) {
      delays.push(delay);
      return Promise.resolve();
    },
  });

  await wrapped.embed('hello');
  assertEquals(delays, [25, 150]);
  assert(delays[0]! >= 0 && delays[0]! <= 100);
  assert(delays[1]! >= 0 && delays[1]! <= 200);
});

Deno.test('abort during backoff stops before another provider attempt', async () => {
  let calls = 0;
  const controller = new AbortController();
  const provider: EmbeddingProviderPort = {
    embed() {
      calls++;
      return Promise.reject(rateLimit());
    },
  };
  const wrapped = withRetryingEmbeddingProvider(provider, {
    maxAttempts: 3,
    sleep(_delay, signal) {
      controller.abort(new DOMException('cancelled', 'AbortError'));
      signal.throwIfAborted();
      return Promise.resolve();
    },
  });

  await assertRejects(() => wrapped.embed('hello', { signal: controller.signal }), DOMException);
  assertEquals(calls, 1);
});

Deno.test('exhausted retries throw typed AiRateLimitError with attempt count', async () => {
  const provider: EmbeddingProviderPort = { embed: () => Promise.reject(rateLimit('1')) };
  const wrapped = withRetryingEmbeddingProvider(provider, {
    maxAttempts: 2,
    sleep: () => Promise.resolve(),
  });

  const error = await assertRejects(() => wrapped.embed('hello'));
  assertInstanceOf(error, AiRateLimitError);
  assertEquals(error.attempts, 2);
  assertEquals(error.retryAfterMs, 1_000);
});

Deno.test('unwrapped providers retain the default no-retry behavior', async () => {
  let calls = 0;
  const provider: EmbeddingProviderPort = {
    embed() {
      calls++;
      return Promise.reject(rateLimit());
    },
  };

  await assertRejects(() => provider.embed('hello'));
  assertEquals(calls, 1);
});

Deno.test('chat retries before output but never replays a partial stream', async () => {
  let calls = 0;
  const client: ChatClientPort = {
    kind: 'text',
    name: 'test',
    async *stream() {
      calls++;
      if (calls === 1) throw rateLimit();
      yield { type: 'text', delta: 'ok' };
    },
  };
  const wrapped = withRetryingChatClient(client, {
    maxAttempts: 2,
    sleep: () => Promise.resolve(),
  });

  const events = [];
  for await (const event of wrapped.stream({ messages: [] })) events.push(event);
  assertEquals(events, [{ type: 'text', delta: 'ok' }]);
  assertEquals(calls, 2);

  let partialCalls = 0;
  const partial: ChatClientPort = {
    kind: 'text',
    name: 'test',
    async *stream() {
      partialCalls++;
      yield { type: 'text', delta: 'partial' };
      throw rateLimit();
    },
  };
  const partialWrapped = withRetryingChatClient(partial, {
    maxAttempts: 3,
    sleep: () => Promise.resolve(),
  });
  await assertRejects(async () => {
    for await (const _event of partialWrapped.stream({ messages: [] })) {
      // Consume the stream so its terminal error is observed.
    }
  });
  assertEquals(partialCalls, 1);
});
