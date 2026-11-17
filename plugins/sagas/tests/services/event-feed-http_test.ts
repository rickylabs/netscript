import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { delay } from '@std/async';
import { spy } from '@std/testing/mock';
import { closeKv, getKv, getRawKv } from '@netscript/kv';
import { createPluginService } from '@netscript/plugin/service';
import { type SagaSSEEvent, SagaSSEEventSchema } from '@netscript/plugin-sagas-core/contracts/v1';
import { router } from '../../services/src/router.ts';
import type { SagaServiceDatabaseClient } from '../../services/src/routers/v1-types.ts';

const db: SagaServiceDatabaseClient = {
  sagaInstance: {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  },
  sagaExecutionHistory: {
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  },
};

function application() {
  return createPluginService(router, {
    name: 'saga-event-feed-test',
    auth: { public: true, reason: 'Exercise the native saga SSE contract in an isolated fixture' },
    context: () => ({ db, sagaRuntime: { publish: () => Promise.resolve() } }),
  }).build();
}

type App = ReturnType<typeof application>;
type Frame = { readonly id?: string; readonly event: SagaSSEEvent };

class Connection {
  private buffer = '';
  private readonly decoder = new TextDecoder();
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private constructor(response: Response, private readonly lifetime: AbortController) {
    assert(response.body);
    this.reader = response.body.getReader();
  }

  static async open(app: App, lastEventId?: string): Promise<Connection> {
    const lifetime = new AbortController();
    const response = await app.request('/api/v1/sagas/subscribe', {
      signal: lifetime.signal,
      headers: lastEventId === undefined ? {} : { 'Last-Event-ID': lastEventId },
    });
    assertEquals(response.status, 200);
    return new Connection(response, lifetime);
  }

  async next(): Promise<Frame> {
    for (;;) {
      const end = this.buffer.indexOf('\n\n');
      if (end >= 0) {
        const text = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 2);
        const fields = text.split('\n');
        const data = fields.filter((line) => line.startsWith('data: '))
          .map((line) => line.slice(6)).join('\n');
        if (!data) continue;
        const decoded: unknown = JSON.parse(data);
        return {
          id: fields.find((line) => line.startsWith('id: '))?.slice(4),
          event: SagaSSEEventSchema.parse(decoded),
        };
      }
      const chunk = await this.reader.read();
      assertEquals(chunk.done, false, 'SSE ended before the expected event.');
      this.buffer += this.decoder.decode(chunk.value, { stream: true }).replaceAll('\r\n', '\n');
    }
  }

  async message(): Promise<Frame> {
    for (;;) {
      const frame = await this.next();
      if (frame.event.type !== 'heartbeat') return frame;
    }
  }

  async close(): Promise<void> {
    this.lifetime.abort();
    await this.reader.cancel();
  }
}

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Expected retained SSE event did not arrive.')),
          2_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function publish(app: App, ordinal: number): Promise<void> {
  const response = await app.request('/api/v1/sagas/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'feed.probe', payload: { ordinal } }),
  });
  assertEquals(response.status, 200, await response.text());
}

function ordinal(frame: Frame): unknown {
  const payload = frame.event.data?.payload;
  return payload && typeof payload === 'object' ? Reflect.get(payload, 'ordinal') : undefined;
}

async function withStorage(run: (app: App) => Promise<void>): Promise<void> {
  await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
  try {
    await run(application());
  } finally {
    await closeKv();
  }
}

Deno.test('two HTTP SSE clients both receive all events when one reader pauses consumption', () =>
  withStorage(async (app) => {
    const fast = await Connection.open(app);
    const slow = await Connection.open(app);
    try {
      assertEquals((await bounded(fast.next())).event.type, 'heartbeat');
      assertEquals((await bounded(slow.next())).event.type, 'heartbeat');
      for (let index = 1; index <= 6; index++) {
        await publish(app, index);
        assertEquals(ordinal(await bounded(fast.message())), index);
      }
      const received: unknown[] = [];
      for (let index = 1; index <= 6; index++) {
        received.push(ordinal(await bounded(slow.message())));
      }
      assertEquals(received, [1, 2, 3, 4, 5, 6]);
    } finally {
      await fast.close();
      await slow.close();
    }
  }));

Deno.test('HTTP Last-Event-ID replays missed events even after another reader consumed them', () =>
  withStorage(async (app) => {
    const resident = await Connection.open(app);
    const original = await Connection.open(app);
    let resumed: Connection | undefined;
    try {
      await bounded(resident.next());
      await bounded(original.next());
      await publish(app, 1);
      const first = await bounded(original.message());
      assertEquals(ordinal(await bounded(resident.message())), 1);
      assert(first.id);
      await original.close();
      for (const index of [2, 3]) {
        await publish(app, index);
        assertEquals(ordinal(await bounded(resident.message())), index);
      }
      resumed = await Connection.open(app, first.id);
      assertEquals((await bounded(resumed.next())).event.type, 'heartbeat');
      const second = await bounded(resumed.message());
      const third = await bounded(resumed.message());
      assertEquals([ordinal(second), ordinal(third)], [2, 3]);
      assertNotEquals(second.id, first.id, 'A reconnect reused a per-connection counter id.');
      assertNotEquals(third.id, second.id);
    } finally {
      await resident.close();
      await original.close();
      await resumed?.close();
    }
  }));

Deno.test('an idle HTTP SSE connection performs zero keyspace list scans', () =>
  withStorage(async (app) => {
    const raw = await getRawKv();
    using listing = spy(raw, 'list');
    const connection = await Connection.open(app);
    try {
      await bounded(connection.next());
      await delay(350);
      assertEquals(listing.calls.length, 0, 'Idle SSE is periodically enumerating the keyspace.');
    } finally {
      await connection.close();
    }
  }));

Deno.test('HTTP event publication retains at most 256 events plus one fixed journal head', () =>
  withStorage(async (app) => {
    for (let index = 0; index < 300; index++) await publish(app, index);
    const kv = await getKv();
    let stored = 0;
    for await (const _entry of kv.list({ prefix: ['saga'] })) stored++;
    assert(stored > 0, 'The retained event history must survive without active readers.');
    assert(stored <= 257, `Unbounded event history retained ${stored} keys.`);
  }));
