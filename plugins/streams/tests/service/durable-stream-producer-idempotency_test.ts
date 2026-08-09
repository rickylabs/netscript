import { assertEquals } from '@std/assert';
import { DurableStreamTestServer } from '@durable-streams/server';
import { DurableStreamProducerTransport } from '../../../../packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts';

Deno.test('producer transport interoperates with reference-server idempotency semantics', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const url = `${baseUrl}/transport/idempotency`;
  const transport = new DurableStreamProducerTransport();
  const firstIdentity = { producerId: 'reference-test', epoch: 0, sequence: 0 } as const;

  try {
    assertEquals((await transport.connect({ url, headers: {} })).ok, true);
    assertEquals(
      await transport.append({ url, headers: {}, body: '{"key":"one"}', identity: firstIdentity }),
      { ok: true, value: { duplicate: false } },
    );
    assertEquals(
      await transport.append({ url, headers: {}, body: '{"key":"one"}', identity: firstIdentity }),
      { ok: true, value: { duplicate: true } },
    );
    assertEquals(
      await transport.append({
        url,
        headers: {},
        body: '{"key":"three"}',
        identity: { ...firstIdentity, sequence: 2 },
      }),
      {
        ok: false,
        failure: { kind: 'sequence-gap', message: 'Producer sequence gap' },
      },
    );

    const response = await fetch(url);
    assertEquals(response.status, 200);
    assertEquals(await response.json(), [{ key: 'one' }]);
  } finally {
    await server.stop();
  }
});
