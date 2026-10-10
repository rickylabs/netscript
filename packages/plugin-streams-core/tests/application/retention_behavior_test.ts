import { assertEquals, assertThrows } from '@std/assert';
import { createDurableStream, DurableStreamProducer } from '../../mod.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';
import { DurableStreamProducerTransport } from '../../src/adapters/durable-stream-producer-transport.ts';
import type { StreamRetentionPolicyV1 } from '../../mod.ts';

async function withStreamsUrl(action: () => Promise<void>): Promise<void> {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  try {
    await action();
  } finally {
    if (previous === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previous);
  }
}

for (
  const [retention, ttl, expiry] of [
    [{ kind: 'ttl', ttlSeconds: 86400 }, '86400', null],
    [{ kind: 'expires-at', expiresAt: '2030-10-01T00:00:00Z' }, null, '2030-10-01T00:00:00Z'],
    [undefined, null, null],
  ] as const
) {
  Deno.test(`retention ${retention?.kind ?? 'omitted'} reaches only the create-time protocol header`, () =>
    withStreamsUrl(async () => {
      const requests: Request[] = [];
      const transport = new DurableStreamProducerTransport((input, init) => {
        requests.push(new Request(input, init));
        return Promise.resolve(new Response(null, { status: 200 }));
      });
      const producer = new DurableStreamProducer({
        streamPath: '/retention',
        schema: createStreamTopicFixture(),
        producerId: 'retention-service',
        retention,
        transport,
      });
      try {
        await producer.waitUntilReady();
        const receipt = producer.upsert('execution', { id: 'one' });
        assertEquals(await receipt.completion, { status: 'delivered', attempts: 1 });
        await producer.close();
        assertEquals(requests.map((request) => request.method), ['PUT', 'POST', 'POST']);
        assertEquals(requests[0].headers.get('Stream-TTL'), ttl);
        assertEquals(requests[0].headers.get('Stream-Expires-At'), expiry);
        for (const request of requests.slice(1)) {
          assertEquals(request.headers.get('Stream-TTL'), null);
          assertEquals(request.headers.get('Stream-Expires-At'), null);
        }
      } finally {
        await producer.stop();
      }
    }));
}

Deno.test('invalid retention fails at construction before transport IO', () =>
  withStreamsUrl(async () => {
    let connects = 0;
    const transport = new DurableStreamProducerTransport(() => {
      connects++;
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    const invalid: StreamRetentionPolicyV1[] = [
      ...[0, -1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1].map((
        ttlSeconds,
      ) => ({ kind: 'ttl', ttlSeconds } as const)),
      ...['', 'tomorrow', '2030-02-30T00:00:00Z', '2030-01-01', '2030-01-01T00:00:00'].map(
        (expiresAt) => ({ kind: 'expires-at', expiresAt } as const),
      ),
    ];
    for (const retention of invalid) {
      assertThrows(() => {
        const producer = new DurableStreamProducer({
          streamPath: '/invalid',
          schema: createStreamTopicFixture(),
          producerId: 'invalid-service',
          retention,
          transport,
        });
        void producer.stop();
      }, RangeError);
    }
    assertEquals(connects, 0);
  }));

Deno.test('retention participates in singleton compatibility and is immutable after construction', () =>
  withStreamsUrl(async () => {
    const policies: (StreamRetentionPolicyV1 | undefined)[] = [];
    const retention = { kind: 'ttl' as const, ttlSeconds: 60 };
    const options = {
      streamPath: '/singleton-retention',
      schema: createStreamTopicFixture(),
      producerId: 'service',
      retention,
      transport: {
        connect: (input: { retention?: StreamRetentionPolicyV1 }) => {
          policies.push(input.retention);
          return Promise.resolve({ ok: true as const, value: undefined });
        },
        append: () => Promise.resolve({ ok: true as const, value: { duplicate: false } }),
        close: () => Promise.resolve({ ok: true as const, value: { duplicate: false } }),
      },
    };
    const producer = createDurableStream(options);
    try {
      await producer.waitUntilReady();
      assertEquals(
        createDurableStream({ ...options, retention: { kind: 'ttl', ttlSeconds: 60 } }),
        producer,
      );
      assertThrows(
        () => createDurableStream({ ...options, retention: { kind: 'ttl', ttlSeconds: 120 } }),
        Error,
        'Incompatible',
      );
      assertThrows(
        () => createDurableStream({ ...options, retention: undefined }),
        Error,
        'Incompatible',
      );
      retention.ttlSeconds = 999;
      assertEquals(policies, [{ kind: 'ttl', ttlSeconds: 60 }]);
    } finally {
      await producer.stop();
    }
  }));
