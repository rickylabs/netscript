import { assert, assertEquals, assertRejects } from '@std/assert';
import { FakeTime } from '@std/testing/time';
import { DenoKvAdapter, type KvKey, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { GCRA_CLOCK_SKEW_BOUND_MS, type StoredGcraState } from '../src/rate-limit/domain/gcra.ts';
import {
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  type RateLimitPolicy,
  type RateLimitStore,
} from '../src/rate-limit/mod.ts';

type StoreFactory = {
  readonly name: string;
  readonly create: (
    policy?: RateLimitPolicy,
  ) => Promise<{ store: RateLimitStore; kv?: KvStore; close: () => Promise<void> }>;
};

const gcraStores: readonly StoreFactory[] = [
  {
    name: 'memory',
    create: (policy: RateLimitPolicy = { kind: 'gcra' }) =>
      Promise.resolve({
        store: createMemoryRateLimitStore({ policy }),
        close: () => Promise.resolve(),
      }),
  },
  {
    name: 'KV-memory',
    create: (policy: RateLimitPolicy = { kind: 'gcra' }) => {
      const kv = new MemoryKvAdapter();
      return Promise.resolve({
        store: createKvRateLimitStore(kv, { prefix: ['gcra-test'], policy }),
        kv,
        close: () => kv.close(),
      });
    },
  },
  {
    name: 'Deno-KV',
    create: async (policy: RateLimitPolicy = { kind: 'gcra' }) => {
      const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
      return {
        store: createKvRateLimitStore(kv, { prefix: ['gcra-test'], policy }),
        kv,
        close: () => kv.close(),
      };
    },
  },
];

for (const factory of gcraStores) {
  Deno.test(`GCRA Gate 1 (${factory.name}): issue #2653 deterministic alignment parity and exact retryAt`, async () => {
    for (
      const [label, arrivals, expectedResetAt, expectedRetryAt] of [
        ['in-window', [100, 200, 300, 400], 60_100, 30_100],
        ['boundary-straddling', [59_850, 59_950, 60_050, 60_150], 119_850, 89_850],
      ] as const
    ) {
      const { store, close } = await factory.create();
      try {
        const decisions = [];
        for (const now of arrivals) {
          decisions.push(
            await store.consume({ key: `sample-${label}`, limit: 2, windowMs: 60_000, now }),
          );
        }
        assertEquals(decisions.map((d) => d.allowed), [true, true, false, false]);
        assertEquals('retryAt' in decisions[0]!, false);
        assertEquals('retryAt' in decisions[1]!, false);
        assertEquals(decisions[2], {
          allowed: false,
          resetAt: expectedResetAt,
          retryAt: expectedRetryAt,
        });
        assertEquals(decisions[3], {
          allowed: false,
          resetAt: expectedResetAt,
          retryAt: expectedRetryAt,
        });

        // Exact millisecond eligibility: retryAt - 1 denies, retryAt admits cleanly.
        assertEquals(
          await store.consume({
            key: `sample-${label}`,
            limit: 2,
            windowMs: 60_000,
            now: expectedRetryAt - 1,
          }),
          { allowed: false, resetAt: expectedResetAt, retryAt: expectedRetryAt },
        );
        const recovered = await store.consume({
          key: `sample-${label}`,
          limit: 2,
          windowMs: 60_000,
          now: expectedRetryAt,
        });
        assertEquals(recovered, { allowed: true, resetAt: expectedResetAt + 30_000 });
        assertEquals('retryAt' in recovered, false);
      } finally {
        await close();
      }
    }
  });
}

Deno.test('GCRA Gate 2 (memory + KV): exact rational 100+ ticks, 1ms upper bound, sub-ms refill, and high limit O(1)', async () => {
  const mem = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
  const memKv = new MemoryKvAdapter();
  const denoKv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const kvMem = createKvRateLimitStore(memKv, {
    prefix: ['gate2'],
    policy: { kind: 'gcra' },
  });
  const kvDeno = createKvRateLimitStore(denoKv, {
    prefix: ['gate2'],
    policy: { kind: 'gcra' },
  });

  try {
    // 1. Non-divisible limit=3, windowMs=1000 over 105 ticks: bit-for-bit parity across all 3 stores.
    let now = 0;
    for (let i = 0; i < 3; i++) {
      const [d1, d2, d3] = await Promise.all([
        mem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
        kvMem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
        kvDeno.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
      ]);
      assertEquals(d1, d2);
      assertEquals(d2, d3);
      assertEquals(d1.allowed, true);
    }
    for (let tick = 0; tick < 105; tick++) {
      const [d1, d2, d3] = await Promise.all([
        mem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
        kvMem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
        kvDeno.consume({ key: 'rat', limit: 3, windowMs: 1_000, now }),
      ]);
      assertEquals(d1, d2);
      assertEquals(d2, d3);
      assertEquals(d1.allowed, false);
      const retryAt = d1.retryAt!;
      if (tick === 0) assertEquals(retryAt, 334);
      const [a1, a2, a3] = await Promise.all([
        mem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now: retryAt }),
        kvMem.consume({ key: 'rat', limit: 3, windowMs: 1_000, now: retryAt }),
        kvDeno.consume({ key: 'rat', limit: 3, windowMs: 1_000, now: retryAt }),
      ]);
      assertEquals(a1, a2);
      assertEquals(a2, a3);
      assertEquals(a1.allowed, true);
      now = retryAt;
    }

    // 2. Half-open 1ms upper bound: windowMs=1, limit=3, burst=3 admits at most 3 at t=50.
    for (const store of [mem, kvMem, kvDeno]) {
      for (let i = 0; i < 3; i++) {
        assertEquals(
          (await store.consume({ key: 'tiny', limit: 3, windowMs: 1, now: 50 })).allowed,
          true,
        );
      }
      assertEquals(await store.consume({ key: 'tiny', limit: 3, windowMs: 1, now: 50 }), {
        allowed: false,
        resetAt: 51,
        retryAt: 51,
      });
    }

    // 3. Sub-ms refill: limit=1000, windowMs=100, burst=2.
    const subMem = createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 2 } });
    const subKv = createKvRateLimitStore(memKv, {
      prefix: ['gate2-sub'],
      policy: { kind: 'gcra', burst: 2 },
    });
    for (const store of [subMem, subKv]) {
      assertEquals(
        (await store.consume({ key: 's', limit: 1_000, windowMs: 100, now: 0 })).allowed,
        true,
      );
      assertEquals(
        (await store.consume({ key: 's', limit: 1_000, windowMs: 100, now: 0 })).allowed,
        true,
      );
      assertEquals(await store.consume({ key: 's', limit: 1_000, windowMs: 100, now: 0 }), {
        allowed: false,
        resetAt: 1,
        retryAt: 1,
      });
      assertEquals(
        (await store.consume({ key: 's', limit: 1_000, windowMs: 100, now: 1 })).allowed,
        true,
      );
      assertEquals(
        (await store.consume({ key: 's', limit: 1_000, windowMs: 100, now: 1 })).allowed,
        true,
      );
    }

    // 4. High limit=100_000, windowMs=3_600_000 stores O(1) four-field record in Deno KV.
    const hiRes = await kvDeno.consume({
      key: 'high',
      limit: 100_000,
      windowMs: 3_600_000,
      now: 10_000,
    });
    assertEquals(hiRes, { allowed: true, resetAt: 10_036 });
    const storedEntry = await denoKv.get<StoredGcraState>([
      'gate2',
      'v1',
      'gcra',
      'high',
      3_600_000,
      100_000,
      100_000,
    ]);
    assertEquals(storedEntry?.value, { v: 1, p: 'gcra', tatMs: 10_036, tatRem: 0 });
  } finally {
    await memKv.close();
    await denoKv.close();
  }
});

Deno.test('GCRA Gate 3: explicit burst=1, burst<limit, and burst>limit with exact KV expireIn', async () => {
  await using kv = new MemoryKvAdapter();
  const observedExpireIns: number[] = [];
  let atomicCalls = 0;
  const origAtomic = kv.atomic.bind(kv);
  kv.atomic = (checks, mutations) => {
    atomicCalls++;
    for (const m of mutations) {
      if (m.type === 'set' && m.expireIn !== undefined) observedExpireIns.push(m.expireIn);
    }
    return origAtomic(checks, mutations);
  };

  // burst: 1 strict spacing (windowMs / limit = 1_000 ms).
  for (
    const store of [
      createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 1 } }),
      createKvRateLimitStore(kv, { prefix: ['b1'], policy: { kind: 'gcra', burst: 1 } }),
    ]
  ) {
    assertEquals(await store.consume({ key: 'k', limit: 60, windowMs: 60_000, now: 500 }), {
      allowed: true,
      resetAt: 1_500,
    });
    assertEquals(await store.consume({ key: 'k', limit: 60, windowMs: 60_000, now: 1_499 }), {
      allowed: false,
      resetAt: 1_500,
      retryAt: 1_500,
    });
    assertEquals(await store.consume({ key: 'k', limit: 60, windowMs: 60_000, now: 1_500 }), {
      allowed: true,
      resetAt: 2_500,
    });
  }

  // burst < limit: limit=60, windowMs=60_000, burst=5.
  for (
    const store of [
      createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 5 } }),
      createKvRateLimitStore(kv, { prefix: ['blt'], policy: { kind: 'gcra', burst: 5 } }),
    ]
  ) {
    for (let i = 1; i <= 5; i++) {
      assertEquals(await store.consume({ key: 'k', limit: 60, windowMs: 60_000, now: 0 }), {
        allowed: true,
        resetAt: i * 1_000,
      });
    }
    assertEquals(await store.consume({ key: 'k', limit: 60, windowMs: 60_000, now: 0 }), {
      allowed: false,
      resetAt: 5_000,
      retryAt: 1_000,
    });
  }

  // burst > limit: limit=1, windowMs=1_000, burst=5 -> 5th write has resetAt=5_000 and expireIn=10_000.
  observedExpireIns.length = 0;
  atomicCalls = 0;
  const gtMem = createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 5 } });
  const gtKv = createKvRateLimitStore(kv, { prefix: ['bgt'], policy: { kind: 'gcra', burst: 5 } });
  for (let i = 1; i <= 5; i++) {
    const [mDec, kDec] = await Promise.all([
      gtMem.consume({ key: 'k', limit: 1, windowMs: 1_000, now: 0 }),
      gtKv.consume({ key: 'k', limit: 1, windowMs: 1_000, now: 0 }),
    ]);
    assertEquals(mDec, { allowed: true, resetAt: i * 1_000 });
    assertEquals(kDec, mDec);
  }
  assertEquals(observedExpireIns[4], 5_000 + GCRA_CLOCK_SKEW_BOUND_MS);
  assertEquals(atomicCalls, 5);

  const [mDeny, kDeny] = await Promise.all([
    gtMem.consume({ key: 'k', limit: 1, windowMs: 1_000, now: 0 }),
    gtKv.consume({ key: 'k', limit: 1, windowMs: 1_000, now: 0 }),
  ]);
  assertEquals(mDeny, { allowed: false, resetAt: 5_000, retryAt: 1_000 });
  assertEquals(kDeny, mDeny);
  assertEquals(atomicCalls, 5); // Zero KV writes on denial.
});

for (const factory of gcraStores) {
  Deno.test(`GCRA Gate 4 (${factory.name}): 30 concurrent reservations never exceed burst and never scan`, async () => {
    const { store, kv, close } = await factory.create({ kind: 'gcra' });
    if (kv) {
      kv.list = () => {
        throw new Error('kv.list must never be called');
      };
    }
    try {
      const now = 10_000;
      const consume = () => store.consume({ key: 'hot', limit: 5, windowMs: 60_000, now });
      const batch = await Promise.all(Array.from({ length: 30 }, () => consume()));
      const admitted = batch.filter((d) => d.allowed).length;
      assert(admitted > 0 && admitted <= 5, `admitted ${admitted} against limit 5`);
      for (let i = admitted; i < 5; i++) {
        assertEquals((await consume()).allowed, true);
      }
      assertEquals(await consume(), {
        allowed: false,
        resetAt: now + 60_000,
        retryAt: now + 12_000,
      });
    } finally {
      await close();
    }
  });
}

Deno.test('GCRA Gate 5a: CAS exhaustion advisory fallback, write-free denial, TTL eviction, prefix & policy isolation', async () => {
  // 1. CAS exhaustion on (i) absent/idle entry and (ii) persisted live entry (stale persisted 40_100 vs tentative 60_100).
  await using kv = new MemoryKvAdapter();
  const realAtomic = kv.atomic.bind(kv);
  const realGet = kv.get.bind(kv);
  let reads = 0;
  let commits = 0;
  let forceConflict = true;
  let forceError: Error | undefined;
  kv.get = (key) => {
    reads++;
    return realGet(key);
  };
  kv.atomic = (checks, mutations) => {
    commits++;
    if (forceError) return Promise.reject(forceError);
    if (forceConflict) return Promise.resolve({ ok: false });
    return realAtomic(checks, mutations);
  };

  const store = createKvRateLimitStore(kv, {
    prefix: ['cas'],
    maxAttempts: 3,
    policy: { kind: 'gcra' },
  });

  // (i) Absent entry: retryAt = 20_100, lastObservedResetAt = 20_100.
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: false,
    retryAt: 20_100,
    resetAt: 20_100,
  });
  assertEquals(reads, 3);
  assertEquals(commits, 3);

  // (ii) Persist two admissions at now=100 (tatMs = 40_100, tatRem = 0), then force conflict on 3rd.
  forceConflict = false;
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: true,
    resetAt: 20_100,
  });
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: true,
    resetAt: 40_100,
  });

  reads = 0;
  commits = 0;
  forceConflict = true;
  // Tentative post-write reset would be 60_100; fallback MUST report stale persisted 40_100!
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: false,
    retryAt: 20_100,
    resetAt: 40_100,
  });
  assertEquals(reads, 3);
  assertEquals(commits, 3);

  // Finish 3rd admission, then verify quota-exhausted denial performs 0 atomic writes.
  forceConflict = false;
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: true,
    resetAt: 60_100,
  });
  commits = 0;
  assertEquals(await store.consume({ key: 'a', limit: 3, windowMs: 60_000, now: 100 }), {
    allowed: false,
    retryAt: 20_100,
    resetAt: 60_100,
  });
  assertEquals(commits, 0);

  // Atomic error throws and never returns { allowed: true }.
  forceError = new Error('backend commit failure');
  await assertRejects(
    () => store.consume({ key: 'err', limit: 3, windowMs: 60_000, now: 100 }),
    Error,
    'backend commit failure',
  );
  forceError = undefined;
  kv.atomic = realAtomic;

  // 2. Shared prefix + coherent policy shares quota; distinct prefix and differing policy tuples isolate.
  const peerA = createKvRateLimitStore(kv, { prefix: ['shared'], policy: { kind: 'gcra' } });
  const peerB = createKvRateLimitStore(kv, { prefix: ['shared'], policy: { kind: 'gcra' } });
  const separate = createKvRateLimitStore(kv, { prefix: ['other'], policy: { kind: 'gcra' } });
  assertEquals(
    (await peerA.consume({ key: 'u', limit: 1, windowMs: 1_000, now: 100 })).allowed,
    true,
  );
  assertEquals(
    (await peerB.consume({ key: 'u', limit: 1, windowMs: 1_000, now: 100 })).allowed,
    false,
  );
  assertEquals(
    (await separate.consume({ key: 'u', limit: 1, windowMs: 1_000, now: 100 })).allowed,
    true,
  );
  // Differing (limit, windowMs, burst) tuple hits an independent policy-scoped bucket.
  assertEquals(
    (await peerB.consume({ key: 'u', limit: 2, windowMs: 1_000, now: 100 })).allowed,
    true,
  );

  // 3. TTL eviction removes expired GCRA KV key cleanly once (resetAt - now) + 5_000 ms elapses.
  using time = new FakeTime(1_000_000);
  await using ttlKv = new MemoryKvAdapter();
  const ttlStore = createKvRateLimitStore(ttlKv, { prefix: ['ttl'], policy: { kind: 'gcra' } });
  const now = Date.now();
  assertEquals((await ttlStore.consume({ key: 'k', limit: 1, windowMs: 100, now })).allowed, true);
  const key: KvKey = ['ttl', 'v1', 'gcra', 'k', 100, 1, 1];
  assert((await ttlKv.get(key)) !== null);
  time.tick(5_099);
  assert((await ttlKv.get(key)) !== null);
  time.tick(1); // 5_100 ms = 100 + 5_000
  assertEquals(await ttlKv.get(key), null);
});

Deno.test('GCRA Gate 10: default and explicit fixed-window KV writes preserve zero-margin TTL and two-field decisions', async () => {
  await using kv = new MemoryKvAdapter();
  const seenExpireIns: number[] = [];
  const origAtomic = kv.atomic.bind(kv);
  kv.atomic = (checks, mutations) => {
    for (const m of mutations) {
      if (m.type === 'set' && m.expireIn !== undefined) seenExpireIns.push(m.expireIn);
    }
    return origAtomic(checks, mutations);
  };

  for (
    const [label, policy] of [
      ['default', undefined],
      ['explicit-fixed', { kind: 'fixed-window' } as const],
    ] as const
  ) {
    seenExpireIns.length = 0;
    const store = createKvRateLimitStore(kv, {
      prefix: ['fixed-reg', label],
      ...(policy ? { policy } : {}),
    });
    const allowed = await store.consume({ key: 'a', limit: 1, windowMs: 5_000, now: 1_234 });
    assertEquals(allowed, { allowed: true, resetAt: 5_000 });
    assertEquals(Object.keys(allowed).sort(), ['allowed', 'resetAt']);
    // Exact zero-margin expireIn = 5_000 - 1_234 = 3_766 (NO +5_000 GCRA margin).
    assertEquals(seenExpireIns, [3_766]);

    const denied = await store.consume({ key: 'a', limit: 1, windowMs: 5_000, now: 1_235 });
    assertEquals(denied, { allowed: false, resetAt: 5_000 });
    assertEquals(Object.keys(denied).sort(), ['allowed', 'resetAt']);
  }
});

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name:
    'GCRA Gate 5b(b)-(c): two-client RedisKvAdapter concurrency and serialization-disjoint prefix isolation',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const namespace = `gcra-test-${crypto.randomUUID()}`;
    const clientA = new RedisKvAdapter({ url: redisUrl, namespace });
    const clientB = new RedisKvAdapter({ url: redisUrl, namespace });
    try {
      const storeA = createKvRateLimitStore(clientA, {
        prefix: ['reads-gcra-a'],
        policy: { kind: 'gcra' },
      });
      const storeB = createKvRateLimitStore(clientB, {
        prefix: ['reads-gcra-a'],
        policy: { kind: 'gcra' },
      });

      // (b) Concurrent reservations across two separate RedisKvAdapter clients (distinct atomicTail).
      const now = 50_000;
      const results = await Promise.all(
        Array.from({ length: 16 }, (_, idx) =>
          (idx % 2 === 0 ? storeA : storeB).consume({
            key: 'shared-key',
            limit: 5,
            windowMs: 60_000,
            now,
          })),
      );
      const admitted = results.filter((d) => d.allowed).length;
      assert(admitted > 0 && admitted <= 5, `admitted ${admitted} against burst 5`);
      for (let i = admitted; i < 5; i++) {
        assertEquals(
          (await storeA.consume({ key: 'shared-key', limit: 5, windowMs: 60_000, now })).allowed,
          true,
        );
      }
      assertEquals(await storeB.consume({ key: 'shared-key', limit: 5, windowMs: 60_000, now }), {
        allowed: false,
        resetAt: now + 60_000,
        retryAt: now + 12_000,
      });

      // (c) Serialization-disjoint prefixes isolate independent limiters even with colon-bearing keys.
      const nsOne = createKvRateLimitStore(clientA, {
        prefix: ['ns-one'],
        policy: { kind: 'gcra' },
      });
      const nsTwo = createKvRateLimitStore(clientB, {
        prefix: ['ns-two'],
        policy: { kind: 'gcra' },
      });
      const colonKey = 'tenant:alpha:read:items';
      assertEquals(
        (await nsOne.consume({ key: colonKey, limit: 1, windowMs: 60_000, now })).allowed,
        true,
      );
      assertEquals(
        (await nsOne.consume({ key: colonKey, limit: 1, windowMs: 60_000, now })).allowed,
        false,
      );
      assertEquals(
        (await nsTwo.consume({ key: colonKey, limit: 1, windowMs: 60_000, now })).allowed,
        true,
      );
    } finally {
      await Promise.all([clientA.close(), clientB.close()]);
    }
  },
});
