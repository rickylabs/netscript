import { assertEquals } from '@std/assert';
import { DurableStreamProducer } from '../../src/application/create-durable-stream.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

interface ControlledStreamsFetch {
  online: boolean;
  readonly deliveredKeys: string[];
  connectFailures: number;
  appendFailures: number;
  restore(): void;
}

function installControlledStreamsFetch(initiallyOnline: boolean): ControlledStreamsFetch {
  const previousFetch = globalThis.fetch;
  const fixture: ControlledStreamsFetch = {
    online: initiallyOnline,
    deliveredKeys: [],
    connectFailures: 0,
    appendFailures: 0,
    restore: () => {
      globalThis.fetch = previousFetch;
    },
  };

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (!fixture.online) {
      if (method === 'PUT') {
        fixture.connectFailures++;
        return new Response('request timeout', { status: 408 });
      } else if (method === 'POST') {
        fixture.appendFailures++;
        return new Response('offline', { status: 503 });
      }
      return new Response('offline', { status: 503 });
    }

    if (method === 'POST') {
      const body = await readRequestBody(input, init);
      if (body !== '') {
        const events: unknown = JSON.parse(body);
        if (Array.isArray(events)) {
          for (const event of events) {
            if (isRecord(event) && typeof event.key === 'string') {
              fixture.deliveredKeys.push(event.key);
            }
          }
        }
      }
    }
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  return fixture;
}

async function readRequestBody(input: string | URL | Request, init?: RequestInit): Promise<string> {
  if (typeof init?.body === 'string') {
    return init.body;
  }
  if (init?.body instanceof Uint8Array) {
    return new TextDecoder().decode(init.body);
  }
  if (init?.body instanceof ArrayBuffer) {
    return new TextDecoder().decode(init.body);
  }
  if (input instanceof Request) {
    return await input.clone().text();
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error('timed out waiting for controlled stream request');
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

function setStreamsUrl(): () => void {
  const previous = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  return () => {
    if (previous === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previous);
    }
  };
}

Deno.test('BEHAVIORAL initial outage reconnects the same producer before a later write', async () => {
  const restoreEnv = setStreamsUrl();
  const fixture = installControlledStreamsFetch(false);
  const producer = new DurableStreamProducer({
    streamPath: '/red/initial-outage',
    schema: createStreamTopicFixture(),
    producerId: 'red-initial-outage',
  });

  try {
    await waitFor(() => fixture.connectFailures === 1);
    fixture.online = true;
    producer.upsert('execution', { id: 'after-start' });

    let flushError: unknown;
    try {
      await producer.flush();
    } catch (error) {
      flushError = error;
    }

    assertEquals(
      flushError,
      undefined,
      'initial outage must not remain latched after the server becomes available',
    );
    assertEquals(fixture.deliveredKeys, ['after-start']);
  } finally {
    await producer.close().catch(() => undefined);
    fixture.restore();
    restoreEnv();
  }
});

Deno.test('BEHAVIORAL mid-session outage retries the failed in-flight write', async () => {
  const restoreEnv = setStreamsUrl();
  const fixture = installControlledStreamsFetch(true);
  const producer = new DurableStreamProducer({
    streamPath: '/red/mid-session',
    schema: createStreamTopicFixture(),
    producerId: 'red-mid-session',
  });

  try {
    producer.upsert('execution', { id: 'before-outage' });
    await producer.flush();

    fixture.online = false;
    producer.upsert('execution', { id: 'during-outage' });
    const recovery = producer.flush();
    await waitFor(() => fixture.appendFailures === 1);
    fixture.online = true;
    await recovery.catch(() => undefined);

    producer.upsert('execution', { id: 'after-outage' });
    await producer.flush().catch(() => undefined);

    assertEquals(
      fixture.deliveredKeys,
      ['before-outage', 'during-outage', 'after-outage'],
      'mid-session batch failure must retain the failed in-flight write',
    );
  } finally {
    await producer.close().catch(() => undefined);
    fixture.restore();
    restoreEnv();
  }
});

Deno.test('BEHAVIORAL recovery delivers a write accepted before the server starts', async () => {
  const restoreEnv = setStreamsUrl();
  const fixture = installControlledStreamsFetch(false);
  const producer = new DurableStreamProducer({
    streamPath: '/red/recovery',
    schema: createStreamTopicFixture(),
    producerId: 'red-recovery',
  });

  try {
    producer.upsert('execution', { id: 'buffered-before-start' });
    await waitFor(() => fixture.connectFailures === 1);
    fixture.online = true;

    let flushError: unknown;
    try {
      await producer.flush();
    } catch (error) {
      flushError = error;
    }

    assertEquals(
      { flushError, delivered: fixture.deliveredKeys },
      { flushError: undefined, delivered: ['buffered-before-start'] },
      'recovery must deliver the write that was accepted while connecting',
    );
  } finally {
    await producer.close().catch(() => undefined);
    fixture.restore();
    restoreEnv();
  }
});

Deno.test('BEHAVIORAL FIFO ordering survives writes that straddle an outage', async () => {
  const restoreEnv = setStreamsUrl();
  const fixture = installControlledStreamsFetch(true);
  const producer = new DurableStreamProducer({
    streamPath: '/red/fifo',
    schema: createStreamTopicFixture(),
    producerId: 'red-fifo',
  });

  try {
    producer.upsert('execution', { id: 'one' });
    await producer.flush();

    fixture.online = false;
    producer.upsert('execution', { id: 'two' });
    producer.upsert('execution', { id: 'three' });
    const recovery = producer.flush();
    await waitFor(() => fixture.appendFailures === 1);
    fixture.online = true;
    await recovery.catch(() => undefined);

    producer.upsert('execution', { id: 'four' });
    await producer.flush().catch(() => undefined);

    assertEquals(
      fixture.deliveredKeys,
      ['one', 'two', 'three', 'four'],
      'FIFO must retain the exact order of writes across reconnect',
    );
  } finally {
    await producer.close().catch(() => undefined);
    fixture.restore();
    restoreEnv();
  }
});
