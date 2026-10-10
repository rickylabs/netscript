import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { os } from '@orpc/server';
import { z } from 'zod';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { createService } from '../mod.ts';
import {
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  createRateLimitMiddleware,
  type RateLimitStore,
} from '../src/rate-limit/mod.ts';

const env = (hostname: string) => ({
  remoteAddr: { transport: 'tcp' as const, hostname, port: 1000 },
});

Deno.test('rate-limit stage enforces a shared per-key window, Retry-After, independent keys and rollover', async () => {
  let now = 1234;
  let handled = 0;
  const app = createService({}, { name: 'rate-limit' })
    .route('get', '/limited', (c) => {
      handled++;
      return c.text('ok');
    })
    .withRateLimit({
      routes: ['/limited'],
      limit: 2,
      windowMs: 5000,
      now: () => now,
      store: createMemoryRateLimitStore(),
    })
    .route('get', '/other', (c) => c.text('unlimited'))
    .build();
  const request = (path = '/limited', client = '192.0.2.1') =>
    app.request(path, undefined, env(client));
  assertEquals((await request()).status, 200);
  assertEquals((await request()).status, 200);
  const rejected = await request();
  assertEquals(rejected.status, 429);
  assertEquals(rejected.headers.get('retry-after'), '4');
  assertEquals(await rejected.json(), { error: 'RATE_LIMITED' });
  assertEquals(handled, 2);
  assertEquals((await request('/limited', '192.0.2.2')).status, 200);
  assertEquals((await request('/other')).status, 200);
  now = 4999;
  assertEquals((await request()).headers.get('retry-after'), '1');
  now = 5000;
  assertEquals((await request()).status, 200);
});

for (
  const projection of [
    { name: 'REST', path: '/api/echo', body: '{}' },
    { name: 'RPC', path: '/api/rpc/echo', body: '{"json":{}}' },
  ]
) {
  Deno.test(`rate-limit stage stops ${projection.name} before routing and body parsing`, async () => {
    let calls = 0;
    const router = os.router({
      echo: os.route({ method: 'POST', path: '/echo' })
        .input(z.object({})).handler(() => {
          calls++;
          return { ok: true };
        }),
    });
    const app = createService(router, { name: 'projection-limit' })
      .withRPC()
      .withRateLimit({
        routes: [projection.path],
        limit: 1,
        windowMs: 10_000,
        now: () => 1000,
        key: (c) => c.req.header('x-test-client') ?? 'test',
        store: createMemoryRateLimitStore(),
      })
      .build();
    assertEquals(
      (await app.request(projection.path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: projection.body,
      })).status,
      200,
    );
    const rejected = await app.request(projection.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid-json',
    });
    assertEquals(rejected.status, 429);
    assertEquals(rejected.headers.get('retry-after'), '9');
    assertEquals(calls, 1);
  });
}

Deno.test('rate-limit selected routes share quota, subtree matching respects boundaries, unmatched routes skip store', async () => {
  let consumes = 0;
  const memory = createMemoryRateLimitStore();
  const store: RateLimitStore = {
    consume: (request) => {
      consumes++;
      return memory.consume(request);
    },
  };
  const app = createService({}, { name: 'paths' })
    .withRateLimit({ routes: ['/device/*'], limit: 1, windowMs: 1000, now: () => 0, store })
    .route('all', '*', (c) => c.text('ok')).build();
  assertEquals((await app.request('/device/start')).status, 200);
  assertEquals((await app.request('/device/poll')).status, 429);
  assertEquals((await app.request('/device')).status, 429);
  assertEquals((await app.request('/devices')).status, 200);
  assertEquals((await app.request('/health')).status, 200);
  assertEquals(consumes, 3);
});

Deno.test('rate-limit Retry-After rounds remaining time at response, CORS wraps 429, repeated build is stable', async () => {
  let now = 0;
  const store: RateLimitStore = {
    consume: () => {
      now = 1001;
      return Promise.resolve({ allowed: false, resetAt: 5000 });
    },
  };
  const builder = createService({}, { name: 'cors-limit' })
    .withCors({ origin: 'https://client.test' })
    .withRateLimit({ routes: ['/limited'], limit: 1, windowMs: 5000, now: () => now, store })
    .route('get', '/limited', (c) => c.text('ok'));
  builder.build();
  const response = await builder.build().request('/limited', {
    headers: { origin: 'https://client.test' },
  });
  assertEquals(response.status, 429);
  assertEquals(response.headers.get('retry-after'), '4');
  assertEquals(response.headers.get('access-control-allow-origin'), 'https://client.test');
});

const stores: Array<
  { name: string; create: () => Promise<{ store: RateLimitStore; close: () => Promise<void> }> }
> = [
  {
    name: 'memory',
    create: () =>
      Promise.resolve({ store: createMemoryRateLimitStore(), close: () => Promise.resolve() }),
  },
  {
    name: 'KV-memory',
    create: () => {
      const kv = new MemoryKvAdapter();
      return Promise.resolve({
        store: createKvRateLimitStore(kv, { prefix: ['limit'] }),
        close: () => kv.close(),
      });
    },
  },
  {
    name: 'Deno-KV',
    create: async () => {
      const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
      return { store: createKvRateLimitStore(kv, { prefix: ['limit'] }), close: () => kv.close() };
    },
  },
];
for (const factory of stores) {
  Deno.test(`${factory.name} rate-limit store enforces key/window isolation, rollover, and concurrent reservations`, async () => {
    const { store, close } = await factory.create();
    try {
      const consume = (key = 'a', now = 0) => store.consume({ key, now, limit: 5, windowMs: 1000 });
      const decisions = await Promise.all(Array.from({ length: 30 }, () => consume()));
      const admitted = decisions.filter((d) => d.allowed).length;
      assert(admitted > 0 && admitted <= 5, `admitted ${admitted} requests against limit 5`);
      // Even when bounded CAS retries reject conservatively, no completed reservation is lost.
      for (let i = admitted; i < 5; i++) assertEquals((await consume()).allowed, true);
      assertEquals((await consume()).allowed, false);
      assertEquals((await consume('b')).allowed, true);
      assertEquals(await consume('a', 1000), { allowed: true, resetAt: 2000 });
      assertEquals((await consume('a', 1999)).resetAt, 2000);
    } finally {
      await close();
    }
  });
}

Deno.test('KV rate-limit CAS conflict budget is fixed, with expiring atomic writes and no scans', async () => {
  await using kv = new MemoryKvAdapter();
  const atomic = kv.atomic.bind(kv);
  const get = kv.get.bind(kv);
  let reads = 0;
  let commits = 0;
  kv.get = (key) => {
    reads++;
    return get(key);
  };
  kv.list = () => {
    throw new Error('unbounded scan');
  };
  kv.atomic = (checks, mutations) => {
    commits++;
    assertEquals(checks.length, 1);
    assertEquals(mutations.length, 1);
    assertEquals(mutations[0], {
      type: 'set',
      key: ['limit', 'a', 5000, 5000],
      value: 1,
      expireIn: 3766,
    });
    return Promise.resolve({ ok: false });
  };
  const store = createKvRateLimitStore(kv, { prefix: ['limit'], maxAttempts: 3 });
  assertEquals(await store.consume({ key: 'a', now: 1234, limit: 2, windowMs: 5000 }), {
    allowed: false,
    resetAt: 5000,
  });
  assertEquals(reads, 3);
  assertEquals(commits, 3);
  kv.atomic = atomic;
});

Deno.test('KV rate-limit adapters share one quota and expired TTL counters are evicted', async () => {
  await using kv = new MemoryKvAdapter();
  const first = createKvRateLimitStore(kv, { prefix: ['shared'] });
  const second = createKvRateLimitStore(kv, { prefix: ['shared'] });
  const now = Date.now();
  const windowMs = 40;
  const request = { key: 'a', now, limit: 1, windowMs };
  assertEquals((await first.consume(request)).allowed, true);
  assertEquals((await second.consume(request)).allowed, false);
  const resetAt = now - now % windowMs + windowMs;
  const key = ['shared', 'a', windowMs, resetAt];
  assertEquals((await kv.get(key))?.value, 1);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assertEquals(await kv.get(key), null);
});

Deno.test('memory rate-limit TTL eviction reclaims capacity and never evicts live quotas', async () => {
  const store = createMemoryRateLimitStore({ maxKeys: 2 });
  const consume = (key: string, now = 0) => store.consume({ key, now, limit: 1, windowMs: 1000 });
  assertEquals((await consume('a')).allowed, true);
  assertEquals((await consume('b')).allowed, true);
  assertEquals((await consume('c')).allowed, false);
  assertEquals((await consume('a')).allowed, false);
  assertEquals((await consume('c', 1000)).allowed, true);
  assertEquals((await consume('d', 1000)).allowed, true);
  assertEquals((await consume('e', 1000)).allowed, false);
});

Deno.test('rate-limit rejects invalid configuration and cancellation, IO failure never opens route', async () => {
  const memory = createMemoryRateLimitStore();
  for (const value of [0, -1, 0.5, NaN, Infinity]) {
    assertThrows(
      () =>
        createRateLimitMiddleware({ routes: ['/a'], limit: value, windowMs: 1000, store: memory }),
      RangeError,
    );
    assertThrows(
      () => createRateLimitMiddleware({ routes: ['/a'], limit: 1, windowMs: value, store: memory }),
      RangeError,
    );
    assertThrows(() => createMemoryRateLimitStore({ maxKeys: value }), RangeError);
  }
  for (const routes of [[], ['a'], ['/a*'], ['/a?b'], ['/a/*/b']]) {
    assertThrows(() =>
      createRateLimitMiddleware({ routes, limit: 1, windowMs: 1000, store: memory })
    );
  }
  await using kv = new MemoryKvAdapter();
  const nonAtomic: KvStore = Object.create(kv);
  nonAtomic.atomic = undefined;
  assertThrows(() => createKvRateLimitStore(nonAtomic, { prefix: ['a'] }), TypeError);
  const signal = AbortSignal.abort(new Error('cancelled'));
  await assertRejects(
    async () => await memory.consume({ key: 'a', limit: 1, windowMs: 1000, now: 0, signal }),
    Error,
    'cancelled',
  );
  const failed: RateLimitStore = { consume: () => Promise.reject(new Error('storage offline')) };
  let calls = 0;
  const app = createService({}, { name: 'failure' }).withRateLimit({
    routes: ['/a'],
    limit: 1,
    windowMs: 1000,
    store: failed,
  })
    .route('get', '/a', (c) => {
      calls++;
      return c.text('ok');
    }).build();
  assertEquals((await app.request('/a')).status, 500);
  assertEquals(calls, 0);
});
