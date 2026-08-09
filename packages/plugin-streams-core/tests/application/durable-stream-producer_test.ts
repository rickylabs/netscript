import { assertEquals, assertThrows } from '@std/assert';
import { DurableStreamProducer } from '../../src/application/create-durable-stream.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

Deno.test('DurableStreamProducer rejects unserializable writes through receipts', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  const previousFetch = globalThis.fetch;
  Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:1');
  globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 200 }))) as typeof fetch;

  try {
    const producer = new DurableStreamProducer({
      streamPath: '/test',
      schema: createStreamTopicFixture(),
      producerId: 'test-producer',
    });

    const circular: Record<string, unknown> = { id: 'circular' };
    circular.self = circular;

    const circularReceipt = producer.upsert('execution', circular);
    const bigintReceipt = producer.upsert('execution', { id: 'bigint', count: 1n });

    assertEquals(circularReceipt.accepted, false);
    assertEquals(await circularReceipt.completion, {
      status: 'rejected',
      reason: 'serialization-failed',
    });
    assertEquals(bigintReceipt.accepted, false);
    assertEquals(await bigintReceipt.completion, {
      status: 'rejected',
      reason: 'serialization-failed',
    });
    await producer.flush();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  }
});

Deno.test('DurableStreamProducer close completes after an aborted connection', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:1');

  const abort = new AbortController();
  abort.abort();

  try {
    const producer = new DurableStreamProducer({
      streamPath: '/aborted-close',
      schema: createStreamTopicFixture(),
      producerId: 'aborted-close-producer',
      signal: abort.signal,
    });

    await producer.close();
    assertEquals(producer.closed, true);

    producer.upsert('execution', { id: 'ignored-after-close' });
    await producer.close();
  } finally {
    if (previousUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  }
});

Deno.test('DurableStreamProducer fails synchronously when streams URL is unavailable', () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  const previousServiceUrl = Deno.env.get('services__streams__http__0');
  Deno.env.delete('DURABLE_STREAMS_URL');
  Deno.env.delete('services__streams__http__0');

  try {
    const error = assertThrows(
      () =>
        new DurableStreamProducer({
          streamPath: '/missing-url',
          schema: createStreamTopicFixture(),
          producerId: 'missing-url-producer',
        }),
      Error,
      'Missing plugin reference "streams"',
    );
    assertEquals(error.message.includes('netscript service generate'), true);
  } finally {
    if (previousUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
    if (previousServiceUrl === undefined) {
      Deno.env.delete('services__streams__http__0');
    } else {
      Deno.env.set('services__streams__http__0', previousServiceUrl);
    }
  }
});
