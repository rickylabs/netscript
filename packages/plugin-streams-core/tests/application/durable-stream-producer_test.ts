import { assertRejects } from '@std/assert';
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
