import { assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import {
  buildStreamUrl,
  createServiceStreamProducer,
  type StreamProducerPort,
  type StreamProducerTransportPort,
} from '@netscript/plugin-streams-core';
import { createStreamTopicFixture } from '@netscript/plugin-streams-core/testing';
import { DurableStreamTestServer } from '@durable-streams/server';
import { DurableStreamProducerTransport } from '../../../../packages/plugin-streams-core/src/adapters/durable-stream-producer-transport.ts';

Deno.test('producer transport interoperates with reference-server idempotency semantics', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const url = `${baseUrl}/transport/idempotency`;
  const transport = new DurableStreamProducerTransport(referenceServerFetch);
  const firstIdentity = { producerId: 'reference-test', epoch: 0, sequence: 0 } as const;
  const request = { url, headers: {}, requestTimeoutMs: 5_000 } as const;

  try {
    assertEquals((await transport.connect(request)).ok, true);
    assertEquals(
      await transport.append({ ...request, body: '{"key":"one"}', identity: firstIdentity }),
      { ok: true, value: { duplicate: false } },
    );
    assertEquals(
      await transport.append({ ...request, body: '{"key":"one"}', identity: firstIdentity }),
      { ok: true, value: { duplicate: true } },
    );
    assertEquals(
      await transport.append({
        ...request,
        body: '{"key":"three"}',
        identity: { ...firstIdentity, sequence: 2 },
      }),
      {
        ok: false,
        failure: { kind: 'sequence-gap', message: 'Producer sequence gap' },
      },
    );

    const response = await referenceServerFetch(url);
    assertEquals(response.status, 200);
    assertEquals(await response.json(), [{ key: 'one' }]);
  } finally {
    await server.stop();
  }
});

// Deno's Node HTTP server can wait on idle keep-alive sockets during server.stop().
const referenceServerFetch: typeof fetch = (input, init) => {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  headers.set('connection', 'close');
  return fetch(input, { ...init, headers });
};

/** Each session uses the public service factory against an actual protocol server. */
async function withProducerSessions(
  run: (fixture: {
    url: string;
    create: (
      initialEpoch: number,
      transport?: StreamProducerTransportPort,
    ) => StreamProducerPort & { close(): Promise<void> };
  }) => Promise<void>,
): Promise<void> {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
  const producers: StreamProducerPort[] = [];
  const streamPath = '/producer-session';
  try {
    await run({
      url: buildStreamUrl(streamPath),
      create(initialEpoch, transport) {
        const producer = createServiceStreamProducer({
          streamPath,
          producerId: 'stable-session-producer',
          initialEpoch,
          schema: createStreamTopicFixture(),
          transport: transport ?? new DurableStreamProducerTransport(referenceServerFetch),
          reconnectPolicy: { initialDelayMs: 0, maxDelayMs: 0, jitterRatio: 0 },
        });
        producers.push(producer);
        return producer;
      },
    });
  } finally {
    await Promise.all(producers.map((producer) => producer.stop()));
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
    await server.stop();
  }
}

async function readStream(url: string) {
  const response = await referenceServerFetch(url);
  assertEquals(response.status, 200);
  const events: unknown = await response.json();
  const offset = response.headers.get('stream-next-offset');
  assertNotEquals(offset, null);
  return { events, offset };
}

Deno.test('real server: stopped and recreated stable producers append changed documents at distinct offsets', async () => {
  await withProducerSessions(async ({ url, create }) => {
    const offsets = new Set<string | null>();
    for (const initialEpoch of [0, 1, 2]) {
      const producer = create(initialEpoch);
      const receipt = producer.upsert('execution', { id: 'same-document', revision: initialEpoch });
      assertEquals((await receipt.completion).status, 'delivered');
      await producer.stop(); // Deliberately no durable EOF: this path will be reopened.
      const snapshot = await readStream(url);
      assertEquals(Array.isArray(snapshot.events) ? snapshot.events.length : -1, initialEpoch + 1);
      offsets.add(snapshot.offset);
    }
    assertEquals(offsets.size, 3);
    const replay = await readStream(url);
    if (!Array.isArray(replay.events)) throw new Error('Expected State Protocol events');
    assertEquals(replay.events.map((event) => event.value.revision), [0, 1, 2]);
  });
});

Deno.test('real server: lost acknowledgement after restart retries exact tuple and bytes and appends once', async () => {
  await withProducerSessions(async ({ url, create }) => {
    const previous = create(0);
    await previous.upsert('execution', { id: 'same-document', revision: 0 }).completion;
    await previous.stop();
    const before = await readStream(url);
    const requests: {
      epoch: string | null;
      sequence: string | null;
      body: string;
      status: number;
    }[] = [];
    const transport = new DurableStreamProducerTransport(async (input, init) => {
      const response = await referenceServerFetch(input, init);
      if (init?.method === 'POST' && typeof init.body === 'string') {
        const headers = new Headers(init.headers);
        requests.push({
          epoch: headers.get('producer-epoch'),
          sequence: headers.get('producer-seq'),
          body: init.body,
          status: response.status,
        });
        if (requests.length === 1) {
          await response.body?.cancel();
          throw new TypeError('Connection lost after the server committed the append');
        }
      }
      return response;
    });
    const producer = create(1, transport);
    const document = { id: 'same-document', revision: 1 };
    const receipt = producer.upsert('execution', document);
    document.revision = 99; // Serialization is retained even if the caller later mutates its input.
    assertEquals(await receipt.completion, { status: 'delivered', attempts: 2 });
    assertEquals(requests.map(({ status }) => status), [200, 204]);
    assertEquals(requests.map(({ epoch, sequence }) => ({ epoch, sequence })), [
      { epoch: '1', sequence: '0' },
      { epoch: '1', sequence: '0' },
    ]);
    assertEquals(requests[0]?.body, requests[1]?.body);
    const appended = await readStream(`${url}?offset=${before.offset}`);
    if (!Array.isArray(appended.events)) throw new Error('Expected State Protocol events');
    assertEquals(appended.events.length, 1);
    assertEquals(appended.events[0].value, { id: 'same-document', revision: 1 });
    await producer.delete('execution', 'same-document').completion;
    assertEquals(requests[2]?.sequence, '1');
  });
});

Deno.test('real server: caller checkpoint skips unchanged documents across restarted sessions without advancing offset', async () => {
  await withProducerSessions(async ({ url, create }) => {
    let checkpoint = '';
    // This is application state, persisted alongside the monotonic epoch in production.
    async function publishIfChanged(producer: StreamProducerPort, revision: number) {
      const document = { id: 'same-document', revision };
      const serialized = JSON.stringify(document);
      if (serialized === checkpoint) return;
      const outcome = await producer.upsert('execution', document).completion;
      assertEquals(outcome.status, 'delivered');
      checkpoint = serialized;
    }
    const first = create(0);
    await publishIfChanged(first, 0);
    await first.stop();
    const second = create(1);
    await publishIfChanged(second, 1);
    await second.stop();
    const before = await readStream(url);
    if (!Array.isArray(before.events)) throw new Error('Expected State Protocol events');
    assertEquals(before.events.map((event) => event.value.revision), [0, 1]);

    const idle = create(2);
    await idle.waitUntilReady();
    await publishIfChanged(idle, 1);
    await idle.flush();
    await idle.stop();
    assertEquals(await readStream(url), before);
    assertEquals((await readStream(`${url}?offset=${before.offset}`)).events, []);
  });
});

Deno.test('real server: explicitly allocated stale append epoch is fenced without stealing a new session', async () => {
  await withProducerSessions(async ({ url, create }) => {
    const first = create(7);
    await first.upsert('execution', { id: 'first' }).completion;
    await first.stop();
    const second = create(8);
    await second.upsert('execution', { id: 'second' }).completion;
    await second.stop();
    const before = await readStream(url);
    const stale = create(7);
    const receipt = stale.upsert('execution', { id: 'must-not-append' });
    const outcome = await receipt.completion;
    assertEquals(outcome.status, 'delivery-unknown');
    if (outcome.status === 'delivery-unknown') assertEquals(outcome.reason, 'transport-refused');
    assertEquals(stale.state.state, 'failed');
    assertEquals(await readStream(url), before);
  });
});

Deno.test('real server: explicitly allocated stale close epoch cannot close another session', async () => {
  await withProducerSessions(async ({ url, create }) => {
    const first = create(8);
    await first.upsert('execution', { id: 'owner' }).completion;
    await first.stop();
    const before = await readStream(url);
    const stale = create(7);
    await assertRejects(() => stale.close(), Error, 'Stale producer epoch');
    assertEquals(stale.state.state, 'failed');
    assertEquals(await readStream(url), before);
    const head = await referenceServerFetch(url, { method: 'HEAD' });
    assertEquals(head.headers.get('stream-closed'), null);
  });
});
