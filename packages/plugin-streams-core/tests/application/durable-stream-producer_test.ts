import { assertEquals, assertRejects } from '@std/assert';
import { DurableStreamProducer } from '../../src/application/create-durable-stream.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

Deno.test('DurableStreamProducer skips unserializable upsert payloads without throwing', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:1');

  const abort = new AbortController();
  abort.abort();

  try {
    const producer = new DurableStreamProducer({
      streamPath: '/test',
      schema: createStreamTopicFixture(),
      producerId: 'test-producer',
      signal: abort.signal,
    });

    const circular: Record<string, unknown> = { id: 'circular' };
    circular.self = circular;

    producer.upsert('execution', circular);
    producer.upsert('execution', { id: 'bigint', count: 1n });

    await assertRejects(() => producer.flush(), Error);
  } finally {
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

Deno.test('DurableStreamProducer drops writes when streams URL is unavailable', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  const previousServiceUrl = Deno.env.get('services__streams__http__0');
  Deno.env.delete('DURABLE_STREAMS_URL');
  Deno.env.delete('services__streams__http__0');

  try {
    const producer = new DurableStreamProducer({
      streamPath: '/missing-url',
      schema: createStreamTopicFixture(),
      producerId: 'missing-url-producer',
    });

    producer.upsert('execution', { id: 'dropped' });
    await producer.close();
    assertEquals(producer.closed, true);
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
