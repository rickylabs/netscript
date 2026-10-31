import { assertEquals } from '@std/assert';
import { z } from 'npm:zod@^4.6.5';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import {
  buildStreamUrl,
  createServiceStreamProducer,
  defineStreamSchema,
} from '@netscript/plugin-streams-core';
import { DurableStreamProducerTransport } from '../../../packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts';

// Run unchanged with --no-check on canary.8: that runtime silently ignores the newer epoch option.
Deno.test('historical stable producer restart must append a second distinct receipt', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  const schema = defineStreamSchema({
    receipt: { schema: z.object({ id: z.string() }), type: 'receipt', primaryKey: 'id' },
  });
  const transport = new DurableStreamProducerTransport((input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('connection', 'close');
    return fetch(input, { ...init, headers });
  });
  let producer: ReturnType<typeof createServiceStreamProducer<typeof schema>> | undefined;
  try {
    Deno.env.set('DURABLE_STREAMS_URL', await server.start());
    for (const initialEpoch of [0, 1]) {
      producer = createServiceStreamProducer({
        streamPath: '/historical-receipts',
        producerId: 'stable-receipt',
        initialEpoch,
        schema,
        transport,
      });
      assertEquals(
        (await producer.upsert('receipt', { id: 'receipt-' + initialEpoch }).completion).status,
        'delivered',
      );
      await producer.stop();
      producer = undefined;
    }
    const response = await fetch(buildStreamUrl('/historical-receipts'), {
      headers: { connection: 'close' },
    });
    assertEquals(response.status, 200);
    const events = z.array(z.object({ value: z.object({ id: z.string() }) }).passthrough()).parse(
      await response.json(),
    );
    assertEquals(
      events.map((event) => event.value.id),
      ['receipt-0', 'receipt-1'],
      'Delivered acknowledgements must correspond to physical appends',
    );
  } finally {
    await producer?.stop();
    await server.stop();
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
});
