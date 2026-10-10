import { assertEquals } from '@std/assert';
import { DurableStreamProducer } from '../../mod.ts';
import type { StreamProducerTransportPort } from '../../mod.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

Deno.test('custom producer timeout does not opt into retry and cannot report later delivery', async () => {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  let calls = 0;
  const transport: StreamProducerTransportPort = {
    connect: () => Promise.resolve({ ok: true, value: undefined }),
    append: () => {
      calls++;
      return Promise.resolve(
        calls === 1
          ? { ok: false, failure: { kind: 'timeout', message: 'custom timeout' } }
          : { ok: true, value: { duplicate: false } },
      );
    },
    close: () => Promise.resolve({ ok: true, value: { duplicate: false } }),
  };
  const producer = new DurableStreamProducer({
    streamPath: '/custom-timeout',
    schema: createStreamTopicFixture(),
    producerId: 'custom-timeout',
    transport,
    reconnectPolicy: { initialDelayMs: 0, maxDelayMs: 0, jitterRatio: 0 },
  });
  try {
    await producer.waitUntilReady();
    assertEquals(await producer.upsert('execution', { id: 'one' }).completion, {
      status: 'delivery-unknown',
      reason: 'transport-refused',
      error: 'custom timeout',
    });
    assertEquals(calls, 1);
  } finally {
    await producer.stop();
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
});
