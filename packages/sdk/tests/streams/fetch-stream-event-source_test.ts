import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import type {
  FetchStreamEventSourceOptionsV1,
  StreamFetchV1,
  StreamSourceSchedulerV1,
} from '../../src/client/stream-source/mod.ts';

class ManualScheduler implements StreamSourceSchedulerV1 {
  now = 0;
  private sequence = 0;
  readonly timers = new Map<number, { at: number; callback: () => void }>();
  schedule(callback: () => void, delayMs: number): () => void {
    const id = ++this.sequence;
    this.timers.set(id, { at: this.now + delayMs, callback });
    return () => {
      this.timers.delete(id);
    };
  }
  advance(ms: number): void {
    this.now += ms;
    for (const [id, timer] of [...this.timers]) {
      if (timer.at <= this.now) {
        this.timers.delete(id);
        timer.callback();
      }
    }
  }
  delays(): number[] {
    return [...this.timers.values()].map((timer) => timer.at - this.now).sort((a, b) => a - b);
  }
}

interface LogEntry {
  readonly id: string;
  readonly offset: string;
}

class FakeFetch {
  constructor(private readonly log: readonly LogEntry[] = []) {}

  /** Serve the durable log from the opaque offset supplied by the client. */
  serve(limit = Infinity, partialNextControl = false): void {
    const offset = this.connections.at(-1)!.url.searchParams.get('offset');
    const committed = offset === '-1' ? -1 : this.log.findIndex((entry) => entry.offset === offset);
    if (committed < 0 && offset !== '-1') throw new Error('unknown replay offset');
    const pending = this.log.slice(committed + 1);
    for (const entry of pending.slice(0, limit)) this.send(data(entry.id) + control(entry.offset));
    if (partialNextControl && pending[limit]) {
      this.send(data(pending[limit].id) + 'event: control\ndata: {"streamNextOffset":"');
    }
  }

  readonly connections: Array<{
    url: URL;
    headers: Headers;
    signal: AbortSignal;
    controller: ReadableStreamDefaultController<Uint8Array>;
    cancelled: boolean;
  }> = [];
  readonly fetch: StreamFetchV1 = (url, init) => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const connection = {
      url: new URL(url),
      headers: new Headers(init.headers),
      signal: init.signal!,
      get controller() {
        return controller;
      },
      cancelled: false,
    };
    const body = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
      cancel() {
        connection.cancelled = true;
      },
    });
    this.connections.push(connection);
    return Promise.resolve(
      new Response(body, { headers: { 'content-type': 'text/event-stream; charset=utf-8' } }),
    );
  };
  send(text: string, index = this.connections.length - 1): void {
    this.connections[index].controller.enqueue(new TextEncoder().encode(text));
  }
  drop(): void {
    this.connections.at(-1)!.controller.error(new Error('forced disconnect'));
  }
}

async function settle(): Promise<void> {
  for (let step = 0; step < 60; step++) await Promise.resolve();
}

async function create(
  options: Partial<FetchStreamEventSourceOptionsV1> = {},
  log: readonly LogEntry[] = [],
) {
  const api = await import('../../src/client/stream-source/mod.ts');
  const transport = new FakeFetch(log);
  const scheduler = new ManualScheduler();
  const source = api.createFetchStreamEventSourceV1({
    url: 'https://streams.example/v1/stream/netscript/tasks?offset=-1',
    fetch: transport.fetch,
    scheduler,
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 25,
    heartbeatTimeoutMs: 100,
    ...options,
  });
  await settle();
  return { ...api, transport, scheduler, source };
}

function data(id: string): string {
  return `id: ${id}\nevent: data\ndata: ${
    JSON.stringify([{
      type: 'tasks',
      key: id,
      value: { id },
      headers: {
        operation: 'upsert',
        correlationId: id,
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
    }])
  }\n\n`;
}
function control(offset: string, terminal = false): string {
  return `event: control\ndata: ${
    JSON.stringify({ streamNextOffset: offset, streamClosed: terminal })
  }\n\n`;
}

Deno.test('fetch source and existing binding run without EventSource or DOM event globals', async () => {
  const names = ['EventSource', 'MessageEvent', 'Event', 'EventTarget', 'window', 'document'];
  const descriptors = names.map((name) =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
  );
  for (const name of names) Reflect.deleteProperty(globalThis, name);
  try {
    assertEquals(Reflect.get(globalThis, 'EventSource'), undefined);
    assertEquals(Reflect.get(globalThis, 'MessageEvent'), undefined);
    const { source, transport, bindStreamEventSourceV1 } = await create();
    const outcomes: string[] = [];
    const binding = bindStreamEventSourceV1({
      source,
      onEvent: (event) => outcomes.push(event.event),
    });
    try {
      transport.send(data('1') + control('opaque:1'));
      await settle();
      assertEquals(outcomes, ['data', 'control']);
      assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:1');
    } finally {
      binding.dispose();
      await source.done;
    }
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    }
  }
});

Deno.test('resume after forced mid-stream disconnect delivers exact IDs with no gap or duplicate', async () => {
  const { source, transport, scheduler, bindStreamEventSourceV1 } = await create({}, [
    { id: '1', offset: 'opaque:1/A' },
    { id: '2', offset: 'opaque:2' },
    { id: '3', offset: 'opaque:3' },
  ]);
  const ids: string[] = [];
  const binding = bindStreamEventSourceV1({
    source,
    onEvent: (event) => {
      if (event.event === 'data') ids.push(...event.payload.map((change) => change.key));
    },
  });
  try {
    transport.serve(1, true);
    await settle();
    assertEquals(ids, ['1']); // Full data without control is still undelivered.
    transport.drop();
    await settle();
    assertEquals(scheduler.delays(), [10]);
    scheduler.advance(10);
    await settle();
    const reconnected = transport.connections[1];
    assertEquals(reconnected.headers.get('last-event-id'), '1');
    assertEquals(reconnected.url.searchParams.get('offset'), 'opaque:1/A');
    assertEquals(reconnected.url.searchParams.get('live'), 'sse');
    transport.serve();
    await settle();
    assertEquals(ids, ['1', '2', '3']);
    assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:3');
  } finally {
    binding.dispose();
    await source.done;
  }
});

Deno.test('byte and comment heartbeats renew deadline; auth refreshes; retries cap; abort stops', async () => {
  const abort = new AbortController();
  let authCalls = 0;
  const { source, transport, scheduler } = await create({
    signal: abort.signal,
    authHeaders: () => Promise.resolve({ authorization: `Bearer token-${++authCalls}` }),
  });
  try {
    assertEquals(authCalls, 1);
    scheduler.advance(90);
    transport.send(': heartbeat\n\n');
    await settle();
    assertEquals(scheduler.delays(), [100]);
    scheduler.advance(90);
    transport.send(': unfinished'); // Even partial received bytes count as activity.
    await settle();
    assertEquals(scheduler.delays(), [100]);
    scheduler.advance(100);
    await settle();
    assert(transport.connections[0].cancelled);
    assert(transport.connections[0].signal.aborted);
    assertEquals(scheduler.delays(), [10]);
    const expectedDelays = [10, 20, 25, 25];
    for (const expected of expectedDelays) {
      assertEquals(scheduler.delays(), [expected]);
      scheduler.advance(expected);
      await settle();
      const current = transport.connections.at(-1)!;
      assertEquals(current.headers.get('authorization'), `Bearer token-${authCalls}`);
      scheduler.advance(100);
      await settle();
    }
    assertEquals(authCalls, 5);
    abort.abort();
    await source.done;
    assertEquals(scheduler.timers.size, 0);
    scheduler.advance(100_000);
    await settle();
    assertEquals(authCalls, 5);
  } finally {
    source.close();
    await source.done;
  }
});

Deno.test('SSE framing preserves UTF-8, multiline data, CRLF, empty IDs, id-only blocks and retry', async () => {
  const { source, transport, scheduler } = await create();
  const messages: Array<[unknown, string | undefined]> = [];
  source.addEventListener('message', (event) => messages.push([event.data, event.lastEventId]));
  try {
    const bytes = new TextEncoder().encode('\ufeffid: token\r\ndata: café\r\ndata: second\r\n\r\n');
    for (const byte of bytes) transport.connections[0].controller.enqueue(new Uint8Array([byte]));
    await settle();
    transport.send(
      'data: inherited\n\nid: bad\0id\ndata: valid\n\nid\n\ndata\n\nretry: 999999999\nretry: invalid\n\n',
    );
    await settle();
    assertEquals(messages, [['café\nsecond', 'token'], ['inherited', 'token'], ['valid', 'token'], [
      '',
      '',
    ]]);
    transport.drop();
    await settle();
    assertEquals(scheduler.delays(), [25]);
    scheduler.advance(25);
    await settle();
    assertEquals(transport.connections[1].headers.get('last-event-id'), null);
    transport.send('id: metadata-only\n\n');
    await settle();
    transport.drop();
    await settle();
    scheduler.advance(25);
    await settle();
    assertEquals(transport.connections[2].headers.get('last-event-id'), 'metadata-only');
  } finally {
    source.close();
    await source.done;
  }
});

Deno.test('framing and uncommitted replay buffers are bounded; invalid control never advances', async () => {
  const { source, transport, scheduler } = await create({
    maxBufferSize: 400,
    maxPendingEvents: 1,
  });
  const messages: unknown[] = [];
  source.addEventListener('data', (event) => messages.push(event.data));
  try {
    transport.send(data('1') + data('2'));
    await settle();
    assertEquals(messages, []);
    assertEquals(scheduler.delays(), [10]);
    assert(transport.connections[0].cancelled);
    scheduler.advance(10);
    await settle();
    transport.send(data('1') + 'event: control\ndata: {}\n\n');
    await settle();
    assertEquals(scheduler.delays(), [20]);
    scheduler.advance(20);
    await settle();
    assertEquals(transport.connections[2].url.searchParams.get('offset'), '-1');
    assertEquals(transport.connections[2].headers.get('last-event-id'), null);
    transport.send('data: ' + 'x'.repeat(401));
    await settle();
    assertEquals(scheduler.delays(), [25]);
  } finally {
    source.close();
    await source.done;
  }
});

Deno.test('HTTP failures retry without reading; 204 and terminal control stop; dispose removes listeners', async () => {
  const { source, transport, scheduler } = await create();
  const seen: string[] = [];
  const listener = () => seen.push('message');
  source.addEventListener('message', listener);
  source.removeEventListener('message', listener);
  transport.send('data: ignore\n\n' + control('terminal', true));
  await source.done;
  assertEquals(seen, []);
  assert(transport.connections[0].cancelled);
  assertEquals(scheduler.timers.size, 0);

  const stopped = await create({
    fetch: () => Promise.resolve(new Response(null, { status: 204 })),
  });
  await stopped.source.done;
  assertEquals(stopped.scheduler.timers.size, 0);

  let cancelled = 0;
  const rejected = await create({
    fetch: () =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            cancel() {
              cancelled++;
            },
          }),
          { status: 503 },
        ),
      ),
  });
  assertEquals(rejected.scheduler.delays(), [10]);
  assertEquals(cancelled, 1);
  rejected.source.close();
  await rejected.source.done;
});

Deno.test('abort interrupts hung auth and fetch; late response bodies are cancelled', async () => {
  for (const stage of ['auth', 'fetch'] as const) {
    const abort = new AbortController();
    let resolve!: (response: Response) => void;
    let fetchCalls = 0;
    const { source, scheduler } = await create({
      signal: abort.signal,
      authHeaders: stage === 'auth'
        ? () => new Promise(() => {})
        : () => ({ authorization: 'Bearer sync' }),
      fetch: () => {
        fetchCalls++;
        return new Promise((value) => {
          resolve = value;
        });
      },
    });
    abort.abort();
    await source.done;
    assertEquals(scheduler.timers.size, 0);
    assertEquals(fetchCalls, stage === 'auth' ? 0 : 1);
    if (stage === 'fetch') {
      let cancelled = false;
      resolve(
        new Response(
          new ReadableStream({
            cancel() {
              cancelled = true;
            },
          }),
        ),
      );
      await settle();
      assert(cancelled);
    }
  }
});

Deno.test('pre-abort never fetches, invalid limits reject, listener failures stop without replay', async () => {
  const abort = new AbortController();
  abort.abort();
  const { source, transport, scheduler, createFetchStreamEventSourceV1 } = await create({
    signal: abort.signal,
  });
  await source.done;
  assertEquals(transport.connections.length, 0);
  assertEquals(scheduler.timers.size, 0);
  assertThrows(
    () =>
      createFetchStreamEventSourceV1({
        url: 'https://streams.example',
        fetch: transport.fetch,
        heartbeatTimeoutMs: 0,
      }),
    RangeError,
  );
  const failing = await create();
  failing.source.addEventListener('message', () => {
    throw new Error('consumer failure');
  });
  failing.transport.send('data: message\n\n');
  await assertRejects(() => failing.source.done, Error, 'consumer failure');
  assertEquals(failing.scheduler.timers.size, 0);
  assert(failing.transport.connections[0].cancelled);
});

Deno.test('abort during credential resolution observes rejected IO without reconnecting', async () => {
  const abort = new AbortController();
  const { source, scheduler, transport } = await create({
    signal: abort.signal,
    authHeaders: () => {
      abort.abort();
      return Promise.reject(new Error('cancelled credential request'));
    },
  });
  await source.done;
  assertEquals(transport.connections.length, 0);
  assertEquals(scheduler.timers.size, 0);
});

Deno.test('server retry is clamped to the configured back-off floor and cap', async () => {
  const { source, transport, scheduler } = await create();
  try {
    for (const [retry, expected] of [[0, 10], [1, 10], [15, 15], [1000, 25]]) {
      transport.send(`retry: ${retry}\n\n`);
      await settle();
      transport.drop();
      await settle();
      assertEquals(scheduler.delays(), [expected]);
      scheduler.advance(expected);
      await settle();
    }
  } finally {
    source.close();
    await source.done;
  }
});

Deno.test('all non-2xx statuses retry and resolve credentials on each connect', async () => {
  const statuses = [401, 403, 404, 503, 302];
  const credentials: Array<string | null> = [];
  let authCalls = 0;
  const { source, scheduler } = await create({
    authHeaders: () => ({ authorization: `Bearer token-${++authCalls}` }),
    fetch: (_url, init) => {
      credentials.push(new Headers(init.headers).get('authorization'));
      return Promise.resolve(new Response(null, { status: statuses[credentials.length - 1] }));
    },
  });
  try {
    for (const delay of [10, 20, 25, 25]) {
      assertEquals(scheduler.delays(), [delay]);
      scheduler.advance(delay);
      await settle();
    }
    assertEquals(credentials, statuses.map((_, index) => `Bearer token-${index + 1}`));
    assertEquals(authCalls, statuses.length);
  } finally {
    source.close();
    await source.done;
    assertEquals(scheduler.timers.size, 0);
  }
});
