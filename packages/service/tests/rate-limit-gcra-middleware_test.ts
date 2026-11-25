import { assertEquals, assertThrows } from '@std/assert';
import type { KvStore } from '@netscript/kv';
import { createService } from '../mod.ts';
import {
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  createRateLimitMiddleware,
  type RateLimitPolicy,
  type RateLimitStore,
} from '../src/rate-limit/mod.ts';

function createZeroIoKvMock(): { kv: KvStore; getCalls: () => number; atomicCalls: () => number } {
  let gets = 0;
  let atomics = 0;
  const kv: KvStore = {
    get: () => {
      gets++;
      throw new Error('unexpected KV get during construction/validation');
    },
    set: () => {
      throw new Error('unexpected KV set');
    },
    delete: () => {
      throw new Error('unexpected KV delete');
    },
    has: () => {
      throw new Error('unexpected KV has');
    },
    list: () => {
      throw new Error('unexpected KV list');
    },
    atomic: () => {
      atomics++;
      throw new Error('unexpected KV atomic during construction/validation');
    },
    close: () => Promise.resolve(),
    [Symbol.asyncDispose]: () => Promise.resolve(),
  };
  return { kv, getCalls: () => gets, atomicCalls: () => atomics };
}

Deno.test('GCRA Gate 9a: middleware Retry-After uses retryAt, falls back to resetAt, preserves CORS, skips unmatched routes', async () => {
  let now = 59_850;
  let handled = 0;
  const store = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
  const app = createService({}, { name: 'gcra-middleware' })
    .withCors({ origin: 'https://client.test' })
    .withRateLimit({
      routes: ['/api/items', '/api/rpc/items/*'],
      limit: 2,
      windowMs: 60_000,
      now: () => now,
      key: () => 'principal:1',
      store,
    })
    .route('get', '/api/items', (c) => {
      handled++;
      return c.json({ ok: true });
    })
    .route('get', '/healthz', (c) => c.text('ok'))
    .build();

  // Issue #2653 boundary-straddling sequence through middleware:
  // 59_850 (allow), 59_950 (allow), 60_050 (deny: retryAt = 89_850, resetAt = 119_850 -> Retry-After: 30).
  assertEquals((await app.request('/api/items')).status, 200);
  now = 59_950;
  assertEquals((await app.request('/api/items')).status, 200);
  now = 60_050;
  const denied = await app.request('/api/items', {
    headers: { origin: 'https://client.test' },
  });
  assertEquals(denied.status, 429);
  assertEquals(denied.headers.get('retry-after'), '30');
  assertEquals(denied.headers.get('access-control-allow-origin'), 'https://client.test');
  assertEquals(await denied.json(), { error: 'RATE_LIMITED' });
  assertEquals(handled, 2);

  // At retryAt - 1 (89_849) still denied with Retry-After: 1; at retryAt (89_850) admitted.
  now = 89_849;
  const stillDenied = await app.request('/api/items');
  assertEquals(stillDenied.status, 429);
  assertEquals(stillDenied.headers.get('retry-after'), '1');
  now = 89_850;
  assertEquals((await app.request('/api/items')).status, 200);
  assertEquals(handled, 3);

  // Unselected routes perform zero store IO.
  let consumes = 0;
  const spyStore: RateLimitStore = {
    validate: (config) => store.validate?.(config),
    consume: (req) => {
      consumes++;
      return store.consume(req);
    },
  };
  const spyApp = createService({}, { name: 'gcra-skip' })
    .use(createRateLimitMiddleware({
      routes: ['/api/items'],
      limit: 2,
      windowMs: 60_000,
      now: () => now,
      store: spyStore,
    }))
    .route('get', '/other', (c) => c.text('ok'))
    .build();
  assertEquals((await spyApp.request('/other')).status, 200);
  assertEquals(consumes, 0);

  // Response-time clock advancement rounds Retry-After from retryAt - responseNow, clamped to >= 1.
  let tick = 1_000;
  const slowStore: RateLimitStore = {
    consume: () => {
      tick = 2_500;
      return Promise.resolve({ allowed: false, resetAt: 10_000, retryAt: 4_001 });
    },
  };
  const slowApp = createService({}, { name: 'gcra-response-clock' })
    .withRateLimit({
      routes: ['/r'],
      limit: 2,
      windowMs: 10_000,
      now: () => tick,
      store: slowStore,
    })
    .route('get', '/r', (c) => c.text('ok'))
    .build();
  const slowRes = await slowApp.request('/r');
  assertEquals(slowRes.status, 429);
  // ceil((4001 - 2500) / 1000) = ceil(1.501) = 2 (NOT resetAt 10_000 -> 8).
  assertEquals(slowRes.headers.get('retry-after'), '2');

  // Custom store omitting retryAt falls back cleanly to resetAt.
  const legacyStore: RateLimitStore = {
    consume: () => Promise.resolve({ allowed: false, resetAt: 5_000 }),
  };
  const legacyApp = createService({}, { name: 'legacy-fallback' })
    .withRateLimit({
      routes: ['/r'],
      limit: 1,
      windowMs: 5_000,
      now: () => 1_000,
      store: legacyStore,
    })
    .route('get', '/r', (c) => c.text('ok'))
    .build();
  const legacyRes = await legacyApp.request('/r');
  assertEquals(legacyRes.status, 429);
  assertEquals(legacyRes.headers.get('retry-after'), '4');
});

Deno.test('GCRA Gate 9b: store and middleware construction fail fast on invalid policy/retention with zero KV IO', () => {
  const mock = createZeroIoKvMock();

  // 1. Store construction validation (zero KV IO).
  for (const invalidPolicy of [null, 'gcra', [], { kind: 'invalid' }]) {
    assertThrows(
      () => createMemoryRateLimitStore({ policy: invalidPolicy as RateLimitPolicy }),
      TypeError,
    );
    assertThrows(
      () =>
        createKvRateLimitStore(mock.kv, {
          prefix: ['p'],
          policy: invalidPolicy as RateLimitPolicy,
        }),
      TypeError,
    );
  }
  for (const burst of [0, -1, 0.5, NaN, Infinity]) {
    assertThrows(() => createMemoryRateLimitStore({ policy: { kind: 'gcra', burst } }), RangeError);
    assertThrows(
      () => createKvRateLimitStore(mock.kv, { prefix: ['p'], policy: { kind: 'gcra', burst } }),
      RangeError,
    );
  }
  assertEquals(mock.getCalls(), 0);
  assertEquals(mock.atomicCalls(), 0);

  // 2. Middleware construction (`createRateLimitMiddleware` & `createService().withRateLimit()`)
  //    rejects over-ceiling rolling combinations synchronously on both memory and KV stores.
  const invalidCombinations: ReadonlyArray<{
    limit: number;
    windowMs: number;
    burst?: number;
  }> = [
    { limit: 1, windowMs: 31_535_995_001 },
    { limit: 1, windowMs: 400 * 86_400_000 },
    { limit: 1, windowMs: 10_000_000_000, burst: 4 },
    { limit: 3, windowMs: 94_607_985_001, burst: 1 },
  ];

  for (const combo of invalidCombinations) {
    const policy: RateLimitPolicy = combo.burst === undefined
      ? { kind: 'gcra' }
      : { kind: 'gcra', burst: combo.burst };
    const memStore = createMemoryRateLimitStore({ policy });
    const kvStore = createKvRateLimitStore(mock.kv, { prefix: ['startup'], policy });

    for (const store of [memStore, kvStore]) {
      assertThrows(
        () => store.validate?.({ limit: combo.limit, windowMs: combo.windowMs }),
        RangeError,
        'rateLimit retention exceeds maximum supported TTL',
      );
      assertThrows(
        () =>
          createRateLimitMiddleware({
            routes: ['/reads'],
            limit: combo.limit,
            windowMs: combo.windowMs,
            store,
          }),
        RangeError,
        'rateLimit retention exceeds maximum supported TTL',
      );
      assertThrows(
        () =>
          createService({}, { name: 'startup-fail' }).withRateLimit({
            routes: ['/reads'],
            limit: combo.limit,
            windowMs: combo.windowMs,
            store,
          }),
        RangeError,
        'rateLimit retention exceeds maximum supported TTL',
      );
    }
  }

  // 3. Valid boundary combinations construct cleanly with zero KV IO.
  const validCombinations: ReadonlyArray<{
    limit: number;
    windowMs: number;
    burst?: number;
  }> = [
    { limit: 1, windowMs: 31_535_995_000 },
    { limit: 3, windowMs: 94_607_985_000, burst: 1 },
    { limit: 10, windowMs: 40_000_000_000, burst: 1 },
  ];

  for (const combo of validCombinations) {
    const policy: RateLimitPolicy = combo.burst === undefined
      ? { kind: 'gcra' }
      : { kind: 'gcra', burst: combo.burst };
    const memStore = createMemoryRateLimitStore({ policy });
    const kvStore = createKvRateLimitStore(mock.kv, { prefix: ['startup-ok'], policy });

    for (const store of [memStore, kvStore]) {
      store.validate?.({ limit: combo.limit, windowMs: combo.windowMs });
      createRateLimitMiddleware({
        routes: ['/reads'],
        limit: combo.limit,
        windowMs: combo.windowMs,
        store,
      });
      createService({}, { name: 'startup-ok' }).withRateLimit({
        routes: ['/reads'],
        limit: combo.limit,
        windowMs: combo.windowMs,
        store,
      });
    }
  }

  // 4. Default fixed-window stores and custom stores omitting `validate` construct cleanly.
  const fixedMem = createMemoryRateLimitStore();
  const fixedKv = createKvRateLimitStore(mock.kv, { prefix: ['fixed'] });
  for (const store of [fixedMem, fixedKv]) {
    store.validate?.({ limit: 1, windowMs: 400 * 86_400_000 });
    createRateLimitMiddleware({
      routes: ['/fixed'],
      limit: 1,
      windowMs: 400 * 86_400_000,
      store,
    });
    for (const bad of [0, -1, 0.5, NaN, Infinity]) {
      assertThrows(() => store.validate?.({ limit: bad, windowMs: 1_000 }), RangeError);
      assertThrows(() => store.validate?.({ limit: 1, windowMs: bad }), RangeError);
    }
  }

  const customNoValidate: RateLimitStore = {
    consume: () => Promise.resolve({ allowed: true, resetAt: 1_000 }),
  };
  createRateLimitMiddleware({
    routes: ['/custom'],
    limit: 1,
    windowMs: 400 * 86_400_000,
    store: customNoValidate,
  });
  createService({}, { name: 'custom-store' }).withRateLimit({
    routes: ['/custom'],
    limit: 1,
    windowMs: 400 * 86_400_000,
    store: customNoValidate,
  });

  // Zero KV IO occurred across all construction and validation checks.
  assertEquals(mock.getCalls(), 0);
  assertEquals(mock.atomicCalls(), 0);
});
