import { assertEquals } from '@std/assert';
import {
  PRODUCER_EPOCH_HEADER,
  PRODUCER_EXPECTED_SEQ_HEADER,
  PRODUCER_ID_HEADER,
  PRODUCER_SEQ_HEADER,
  STREAM_CLOSED_HEADER,
} from '@durable-streams/client';
import { DurableStreamProducerTransport } from '../../src/adapters/durable-stream-producer-transport.ts';

const identity = { producerId: 'transport-test', epoch: 3, sequence: 7 } as const;

Deno.test('producer transport retains the exact body and idempotency tuple', async () => {
  let request: Request | undefined;
  const transport = new DurableStreamProducerTransport((input, init) => {
    request = new Request(input, init);
    return Promise.resolve(new Response(null, { status: 200 }));
  });

  const result = await transport.append({
    url: 'http://streams.test/exact',
    headers: { authorization: 'Bearer test' },
    requestTimeoutMs: 1_000,
    body: '{"key":"one"}',
    identity,
  });

  assertEquals(result, { ok: true, value: { duplicate: false } });
  assertEquals(await request?.text(), '[{"key":"one"}]');
  assertEquals(request?.headers.get(PRODUCER_ID_HEADER), 'transport-test');
  assertEquals(request?.headers.get(PRODUCER_EPOCH_HEADER), '3');
  assertEquals(request?.headers.get(PRODUCER_SEQ_HEADER), '7');
  assertEquals(request?.headers.get('authorization'), 'Bearer test');
});

Deno.test('producer transport classifies retry, stale epoch, gap, and closed responses', async () => {
  const responses = [
    new Response('offline', { status: 503 }),
    new Response('stale', {
      status: 403,
      headers: { [PRODUCER_EPOCH_HEADER]: '9' },
    }),
    new Response('gap', {
      status: 409,
      headers: { [PRODUCER_EXPECTED_SEQ_HEADER]: '4' },
    }),
    new Response('closed', {
      status: 409,
      headers: { [STREAM_CLOSED_HEADER]: 'true' },
    }),
  ];
  const transport = new DurableStreamProducerTransport(() => Promise.resolve(responses.shift()!));
  const append = () =>
    transport.append({
      url: 'http://streams.test/classify',
      headers: {},
      requestTimeoutMs: 1_000,
      body: '{"key":"one"}',
      identity,
    });

  assertEquals(await append(), {
    ok: false,
    failure: { kind: 'retryable', message: 'offline' },
  });
  assertEquals(await append(), {
    ok: false,
    failure: { kind: 'stale-epoch', message: 'stale', currentEpoch: 9 },
  });
  assertEquals(await append(), {
    ok: false,
    failure: { kind: 'sequence-gap', message: 'gap' },
  });
  assertEquals(await append(), {
    ok: false,
    failure: { kind: 'stream-closed', message: 'closed' },
  });
});

Deno.test('producer transport turns a hung request timeout into a retryable failure', async () => {
  const transport = new DurableStreamProducerTransport((_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    })
  );

  const result = await transport.connect({
    url: 'http://streams.test/hung',
    headers: {},
    requestTimeoutMs: 5,
  });

  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.failure.kind, 'retryable');
});
