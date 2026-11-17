import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { delay } from '@std/async';
import { spy } from '@std/testing/mock';
import '@netscript/kv/redis';
import { KvSagaEventFeed } from '@netscript/plugin-sagas-core/adapters';
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
type RawFrame = { readonly id?: string; readonly eventName?: string; readonly data: unknown };

class Connection {
  private buffer = '';
  private readonly decoder = new TextDecoder();
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private constructor(response: Response, private readonly lifetime: AbortController) {
    assert(response.body);
    this.reader = response.body.getReader();
  }

  static async open(app: App, lastEventId?: string, query = ''): Promise<Connection> {
    const lifetime = new AbortController();
    const response = await app.request(`/api/v1/sagas/subscribe${query}`, {
      signal: lifetime.signal,
      headers: lastEventId === undefined ? {} : { 'Last-Event-ID': lastEventId },
    });
    assertEquals(response.status, 200);
    return new Connection(response, lifetime);
  }

  async raw(): Promise<RawFrame> {
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
          eventName: fields.find((line) => line.startsWith('event: '))?.slice(7),
          data: decoded,
        };
      }
      const chunk = await this.reader.read();
      assertEquals(chunk.done, false, 'SSE ended before the expected event.');
      this.buffer += this.decoder.decode(chunk.value, { stream: true }).replaceAll('\r\n', '\n');
    }
  }

  async next(): Promise<Frame> {
    const frame = await this.raw();
    assert(frame.eventName !== 'error', JSON.stringify(frame.data));
    return { id: frame.id, event: SagaSSEEventSchema.parse(frame.data) };
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
          5_000,
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

async function withStorage(run: (app: App) => Promise<void>, backend = 'deno-kv'): Promise<void> {
  if (backend !== 'deno-kv') {
    await getKv({
      provider: 'redis',
      skipServiceDiscovery: true,
      redisUrl: Deno.env.get(
        backend === 'redis' ? 'NETSCRIPT_TEST_REDIS_URL' : 'NETSCRIPT_TEST_GARNET_URL',
      ),
      redisNamespace: `saga-http-${crypto.randomUUID()}`,
    });
  } else await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
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
      const ready = await bounded(fast.next());
      assertEquals(ready.event.type, 'heartbeat');
      assertEquals(ready.id, undefined);
      const ids: (string | undefined)[] = [];
      assertEquals((await bounded(slow.next())).event.type, 'heartbeat');
      for (let index = 1; index <= 6; index++) {
        await publish(app, index);
        const item = await bounded(fast.message());
        assertEquals(ordinal(item), index);
        ids.push(item.id);
      }
      const received: unknown[] = [];
      for (let index = 1; index <= 6; index++) {
        const item = await bounded(slow.message());
        received.push(ordinal(item));
        assertEquals(item.id, ids[index - 1]);
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

Deno.test('native HTTP replay errors distinguish malformed/future ids from expired/foreign/reset history', () =>
  withStorage(async (app) => {
    const kv = await getKv();
    const feed = new KvSagaEventFeed(kv);
    const one = await feed.append({ type: 'saga:started', timestamp: new Date().toISOString() });
    const epoch = one.id.split(':')[0];
    for (let i = 2; i <= 258; i++) {
      await feed.append({ type: 'saga:started', timestamp: new Date().toISOString() });
    }
    for (
      const [afterId, code, status, reason] of [
        ['bad-cursor', 'BAD_REQUEST', 400, 'invalid-cursor'],
        [`${epoch}:999`, 'BAD_REQUEST', 400, 'invalid-cursor'],
        [one.id, 'CONFLICT', 409, 'history-lost'],
        [`${crypto.randomUUID()}:1`, 'CONFLICT', 409, 'history-lost'],
      ] as const
    ) {
      const connection = await Connection.open(app, afterId);
      try {
        await assertErrorFrame(connection, code, status, reason);
      } finally {
        await connection.close();
      }
    }
    await kv.delete(['saga', 'event-feed', 'v1', 'head']);
    const reset = await Connection.open(app, `${epoch}:258`);
    try {
      await assertErrorFrame(reset, 'CONFLICT', 409, 'history-lost');
    } finally {
      await reset.close();
    }
  }));

Deno.test('HTTP backend failure is an explicit native unavailable frame', () =>
  withStorage(async (app) => {
    const kv = await getKv();
    await kv.set(['saga', 'event-feed', 'v1', 'head'], { format: 99 });
    const connection = await Connection.open(app);
    try {
      await assertErrorFrame(connection, 'SERVICE_UNAVAILABLE', 503, 'unavailable');
    } finally {
      await connection.close();
    }
  }));

Deno.test('HTTP sagaName filtering advances the global cursor and retains stable replay ids', () =>
  withStorage(async (app) => {
    const connection = await Connection.open(app, undefined, '?sagaName=orders');
    let replay: Connection | undefined;
    try {
      assertEquals((await bounded(connection.next())).id, undefined);
      const feed = new KvSagaEventFeed(await getKv());
      await feed.append({
        type: 'saga:started',
        timestamp: new Date().toISOString(),
        sagaName: 'other',
      });
      const matching = await feed.append({
        type: 'saga:started',
        timestamp: new Date().toISOString(),
        sagaName: 'orders',
      });
      const frame = await bounded(connection.message());
      assertEquals(frame.id, matching.id);
      await connection.close();
      await feed.append({
        type: 'saga:completed',
        timestamp: new Date().toISOString(),
        sagaName: 'other',
      });
      const tail = await feed.append({
        type: 'saga:completed',
        timestamp: new Date().toISOString(),
        sagaName: 'orders',
      });
      replay = await Connection.open(app, matching.id, '?sagaName=orders');
      assertEquals((await bounded(replay.next())).id, undefined);
      assertEquals((await bounded(replay.message())).id, tail.id);
    } finally {
      await connection.close();
      await replay?.close();
    }
  }));

for (const backend of ['redis', 'garnet']) {
  if (
    !Deno.env.get(backend === 'redis' ? 'NETSCRIPT_TEST_REDIS_URL' : 'NETSCRIPT_TEST_GARNET_URL')
  ) continue;
  Deno.test(`real HTTP ${backend}: ordered fanout and native Last-Event-ID replay`, () =>
    withStorage(async (app) => {
      const first = await Connection.open(app);
      const slow = await Connection.open(app);
      let resumed: Connection | undefined;
      try {
        await bounded(first.next());
        await bounded(slow.next());
        const ids: string[] = [];
        for (let i = 1; i <= 8; i++) {
          await publish(app, i);
          const frame = await bounded(first.message());
          assertEquals(ordinal(frame), i);
          assert(frame.id);
          ids.push(frame.id);
        }
        for (let i = 1; i <= 8; i++) {
          const frame = await bounded(slow.message());
          assertEquals(ordinal(frame), i);
          assertEquals(frame.id, ids[i - 1]);
        }
        await first.close();
        resumed = await Connection.open(app, ids[3]);
        assertEquals((await bounded(resumed.next())).id, undefined);
        for (const id of ids.slice(4)) assertEquals((await bounded(resumed.message())).id, id);
      } finally {
        await first.close();
        await slow.close();
        await resumed?.close();
      }
    }, backend));
}

async function assertErrorFrame(
  connection: Connection,
  code: string,
  status: number,
  reason: string,
): Promise<void> {
  const frame = await bounded(connection.raw());
  assertEquals(frame.eventName, 'error');
  assertEquals(frame.id, undefined);
  assert(frame.data && typeof frame.data === 'object');
  assertEquals(Reflect.get(frame.data, 'code'), code);
  assertEquals(Reflect.get(frame.data, 'status'), status);
  const data: unknown = Reflect.get(frame.data, 'data');
  assert(data && typeof data === 'object');
  assertEquals(Reflect.get(data, 'reason'), reason);
  if (reason === 'history-lost' && Reflect.get(data, 'latestId')) {
    assert(typeof Reflect.get(data, 'oldestId') === 'string');
  }
}
