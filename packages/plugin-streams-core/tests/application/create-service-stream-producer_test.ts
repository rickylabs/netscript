import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { createServiceStreamProducer } from '../../src/application/create-service-stream-producer.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

interface RecordedRequest {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | null;
  readonly body: string;
}

function snapshotStreamsEnv(): () => void {
  const keys = [
    'DURABLE_STREAMS_URL',
    'services__streams__http__0',
    'STREAMS_SECRET',
    'DURABLE_STREAMS_SECRET',
  ];
  const previous = new Map(keys.map((key) => [key, Deno.env.get(key)]));
  return () => {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
  };
}

function installRecordingFetch(sink: RecordedRequest[]): () => void {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
    const headers = new Headers(init?.headers ?? undefined);
    let body = '';
    if (typeof init?.body === 'string') {
      body = init.body;
    } else if (init?.body instanceof Uint8Array) {
      body = new TextDecoder().decode(init.body);
    }
    sink.push({
      url,
      method: init?.method ?? 'GET',
      authorization: headers.get('authorization'),
      body,
    });
    // Producer append (POST) and stream create (PUT) both accept a 200.
    return Promise.resolve(new Response(null, { status: 200 }));
  }) as typeof fetch;
  return () => {
    globalThis.fetch = previousFetch;
  };
}

Deno.test('createServiceStreamProducer resolves Aspire streams discovery and reaches the resolved endpoint', async () => {
  const restoreEnv = snapshotStreamsEnv();
  const requests: RecordedRequest[] = [];
  const restoreFetch = installRecordingFetch(requests);

  // Simulate a scaffolded Service with ServiceReferences: ["streams"] wiring:
  // Aspire injects services__streams__http__0 + the streams secret.
  Deno.env.delete('DURABLE_STREAMS_URL');
  Deno.env.set('services__streams__http__0', 'http://streams.internal:4437');
  Deno.env.set('STREAMS_SECRET', 'svc-secret');

  try {
    const producer = createServiceStreamProducer({
      streamPath: '/eischat/completions',
      schema: createStreamTopicFixture(),
      producerId: 'eischat-service',
    });

    producer.upsert('execution', { id: 'run-1', status: 'done' });
    await producer.flush();

    producer.delete('execution', 'run-1');
    await producer.flush();

    await producer.close();

    const expectedBase = 'http://streams.internal:4437/v1/stream/netscript/eischat/completions';
    for (const request of requests) {
      assertStringIncludes(
        request.url,
        expectedBase,
        `request went to ${request.url} instead of the resolved streams endpoint`,
      );
    }

    const writes = requests.filter((request) => request.method === 'POST');
    assertEquals(
      writes.length >= 1,
      true,
      'expected at least one POST write to the streams endpoint',
    );
    for (const write of writes) {
      assertEquals(write.authorization, 'Bearer svc-secret');
    }

    const writtenBodies = writes.map((write) => write.body).join('\n');
    assertStringIncludes(writtenBodies, '"key":"run-1"');
    assertStringIncludes(writtenBodies, '"operation":"upsert"');
    assertStringIncludes(writtenBodies, '"operation":"delete"');
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test('createServiceStreamProducer fails fast when the streams service is not wired', () => {
  const restoreEnv = snapshotStreamsEnv();
  Deno.env.delete('DURABLE_STREAMS_URL');
  Deno.env.delete('services__streams__http__0');

  try {
    assertThrows(
      () =>
        createServiceStreamProducer({
          streamPath: '/eischat/unwired',
          schema: createStreamTopicFixture(),
          producerId: 'eischat-unwired',
        }),
      Error,
      'Durable streams URL not found',
    );
  } finally {
    restoreEnv();
  }
});

Deno.test('createServiceStreamProducer with assertResolvable:false defers resolution to connect time', async () => {
  const restoreEnv = snapshotStreamsEnv();
  Deno.env.delete('DURABLE_STREAMS_URL');
  Deno.env.delete('services__streams__http__0');

  try {
    // Does not throw at construction because eager validation is disabled.
    const producer = createServiceStreamProducer({
      streamPath: '/eischat/deferred',
      schema: createStreamTopicFixture(),
      producerId: 'eischat-deferred',
      assertResolvable: false,
    });

    producer.upsert('execution', { id: 'dropped' });
    await producer.close();
    assertEquals(producer.closed, true);
  } finally {
    restoreEnv();
  }
});
