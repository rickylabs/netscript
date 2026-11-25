import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  DenoKvAdapter,
  type KvEntry,
  type KvKey,
  type KvStore,
  MemoryKvAdapter,
} from '@netscript/kv';
import {
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  type RateLimitStore,
} from '../src/rate-limit/mod.ts';

interface ClockControlledKv {
  readonly kv: KvStore;
  advanceBackend(ms: number): void;
  readonly getAtomicWrites: () => number;
  readonly lastExpireIn: () => number | undefined;
}

function createClockControlledKv(initialBackendNow = 0): ClockControlledKv {
  let backendNow = initialBackendNow;
  let versionCounter = 0;
  let atomicWrites = 0;
  let recentExpireIn: number | undefined;

  const entries = new Map<
    string,
    { key: KvKey; value: unknown; versionstamp: string; expiresAt?: number }
  >();

  const serialize = (key: KvKey): string => JSON.stringify(key);
  const live = (serialized: string) => {
    const entry = entries.get(serialized);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= backendNow) {
      entries.delete(serialized);
      return null;
    }
    return entry;
  };

  const kv: KvStore = {
    get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
      const entry = live(serialize(key));
      if (!entry) return Promise.resolve(null);
      return Promise.resolve({
        key: entry.key,
        value: entry.value as T,
        versionstamp: entry.versionstamp,
      });
    },
    set(key: KvKey, value: unknown, options?: { expireIn?: number }): Promise<void> {
      const versionstamp = String(++versionCounter);
      entries.set(serialize(key), {
        key,
        value,
        versionstamp,
        expiresAt: options?.expireIn ? backendNow + options.expireIn : undefined,
      });
      return Promise.resolve();
    },
    delete(key: KvKey): Promise<void> {
      entries.delete(serialize(key));
      return Promise.resolve();
    },
    has(key: KvKey): Promise<boolean> {
      return Promise.resolve(live(serialize(key)) !== null);
    },
    list<T = unknown>(): AsyncIterable<KvEntry<T>> {
      throw new Error('list must not be called');
    },
    atomic(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult> {
      atomicWrites++;
      for (const check of checks) {
        const current = live(serialize(check.key));
        if ((current?.versionstamp ?? null) !== check.versionstamp) {
          return Promise.resolve({ ok: false });
        }
      }
      const versionstamp = String(++versionCounter);
      for (const m of mutations) {
        if (m.type === 'set') {
          recentExpireIn = m.expireIn;
          entries.set(serialize(m.key), {
            key: m.key,
            value: m.value,
            versionstamp,
            expiresAt: m.expireIn ? backendNow + m.expireIn : undefined,
          });
        } else if (m.type === 'delete') {
          entries.delete(serialize(m.key));
        }
      }
      return Promise.resolve({ ok: true, versionstamp });
    },
    close: () => Promise.resolve(),
    [Symbol.asyncDispose]: () => Promise.resolve(),
  };

  return {
    kv,
    advanceBackend: (ms: number) => {
      backendNow += ms;
    },
    getAtomicWrites: () => atomicWrites,
    lastExpireIn: () => recentExpireIn,
  };
}

Deno.test('GCRA Gate 6a: split backend-clock vs request-clock fixed retention boundary (separate observation & renewal fixtures)', async () => {
  const cases = [
    {
      name: 'short-TAT (L=W=60_000, B=1)',
      limit: 60_000,
      windowMs: 60_000,
      burst: 1,
      writerNow: 100,
      expectedResetAt: 101,
      expectedExpireIn: 5_001,
      lagAdvanceMs: 1,
      lagReaderNow: 100,
      onTimeReaderNow: 101,
      refreshedResetAt: 102,
    },
    {
      name: 'full-second (L=B=1, W=1_000)',
      limit: 1,
      windowMs: 1_000,
      burst: 1,
      writerNow: 100,
      expectedResetAt: 1_100,
      expectedExpireIn: 6_000,
      lagAdvanceMs: 1_000,
      lagReaderNow: 1_099,
      onTimeReaderNow: 1_100,
      refreshedResetAt: 2_100,
    },
  ] as const;

  for (const tc of cases) {
    // (i) Original-write expiry fixture (NO intervening renewing admission).
    {
      const clock = createClockControlledKv(0);
      const store = createKvRateLimitStore(clock.kv, {
        prefix: ['gate6a-obs'],
        policy: { kind: 'gcra', burst: tc.burst },
      });
      const key: KvKey = [
        'gate6a-obs',
        'v1',
        'gcra',
        'k',
        tc.windowMs,
        tc.limit,
        tc.burst,
      ];

      assertEquals(
        await store.consume({
          key: 'k',
          limit: tc.limit,
          windowMs: tc.windowMs,
          now: tc.writerNow,
        }),
        { allowed: true, resetAt: tc.expectedResetAt },
      );
      assertEquals(clock.lastExpireIn(), tc.expectedExpireIn);
      assertEquals(clock.getAtomicWrites(), 1);

      clock.advanceBackend(tc.lagAdvanceMs);
      assertEquals(
        await store.consume({
          key: 'k',
          limit: tc.limit,
          windowMs: tc.windowMs,
          now: tc.lagReaderNow,
        }),
        { allowed: false, resetAt: tc.expectedResetAt, retryAt: tc.expectedResetAt },
      );
      assertEquals(clock.getAtomicWrites(), 1); // Zero KV writes on lagging denial.

      // Still present 1 ms before original deadline, physically evicted at exact deadline.
      clock.advanceBackend(tc.expectedExpireIn - tc.lagAdvanceMs - 1);
      assert((await clock.kv.get(key)) !== null, `${tc.name}: expected key retained before TTL`);
      clock.advanceBackend(1);
      assertEquals(await clock.kv.get(key), null, `${tc.name}: expected key evicted at TTL`);
    }

    // (ii) Separate fresh fixture for on-time logical-idle admission & TTL refresh.
    {
      const clock = createClockControlledKv(0);
      const store = createKvRateLimitStore(clock.kv, {
        prefix: ['gate6a-renew'],
        policy: { kind: 'gcra', burst: tc.burst },
      });
      const key: KvKey = [
        'gate6a-renew',
        'v1',
        'gcra',
        'k',
        tc.windowMs,
        tc.limit,
        tc.burst,
      ];

      assertEquals(
        await store.consume({
          key: 'k',
          limit: tc.limit,
          windowMs: tc.windowMs,
          now: tc.writerNow,
        }),
        { allowed: true, resetAt: tc.expectedResetAt },
      );
      clock.advanceBackend(tc.lagAdvanceMs);

      // On-time peer treats retained key as logically idle, admits, and refreshes TTL from new anchor.
      assertEquals(
        await store.consume({
          key: 'k',
          limit: tc.limit,
          windowMs: tc.windowMs,
          now: tc.onTimeReaderNow,
        }),
        { allowed: true, resetAt: tc.refreshedResetAt },
      );
      assertEquals(clock.lastExpireIn(), tc.expectedExpireIn);
      assertEquals(clock.getAtomicWrites(), 2);

      // Remains present past the original deadline, then expires at the refreshed deadline.
      clock.advanceBackend(tc.expectedExpireIn - tc.lagAdvanceMs);
      assert(
        (await clock.kv.get(key)) !== null,
        `${tc.name}: renewed key must outlive original TTL`,
      );
      clock.advanceBackend(tc.lagAdvanceMs - 1);
      assert((await clock.kv.get(key)) !== null);
      clock.advanceBackend(1);
      assertEquals(await clock.kv.get(key), null);
    }
  }
});

Deno.test('GCRA Gate 6b: safe-time overflow oracle across stores, Deno KV TTL ceiling, and cross-key backward step parity', async () => {
  const M = Number.MAX_SAFE_INTEGER;
  const memKv = new MemoryKvAdapter();
  const denoKv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  let lastMemKvExpireIn: number | undefined;
  let memKvReads = 0;
  let memKvWrites = 0;
  const origGet = memKv.get.bind(memKv);
  const origAtomic = memKv.atomic.bind(memKv);
  memKv.get = (key) => {
    memKvReads++;
    return origGet(key);
  };
  memKv.atomic = (checks, mutations) => {
    memKvWrites++;
    for (const m of mutations) {
      if (m.type === 'set') lastMemKvExpireIn = m.expireIn;
    }
    return origAtomic(checks, mutations);
  };

  try {
    const stores: Array<{ name: string; store: RateLimitStore; isMemKv?: boolean }> = [
      { name: 'memory', store: createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 2 } }) },
      {
        name: 'KV-memory',
        store: createKvRateLimitStore(memKv, {
          prefix: ['gate6b'],
          policy: { kind: 'gcra', burst: 2 },
        }),
        isMemKv: true,
      },
      {
        name: 'Deno-KV',
        store: createKvRateLimitStore(denoKv, {
          prefix: ['gate6b'],
          policy: { kind: 'gcra', burst: 2 },
        }),
      },
    ];

    for (const { store, isMemKv } of stores) {
      // (a) now = M - 2: Req 1 (M-1), Req 2 (M), Req 3 throws RangeError with zero KV write.
      assertEquals(await store.consume({ key: 'a', limit: 2, windowMs: 2, now: M - 2 }), {
        allowed: true,
        resetAt: M - 1,
      });
      assertEquals(await store.consume({ key: 'a', limit: 2, windowMs: 2, now: M - 2 }), {
        allowed: true,
        resetAt: M,
      });
      const writesBefore = memKvWrites;
      await assertRejects(
        () => store.consume({ key: 'a', limit: 2, windowMs: 2, now: M - 2 }),
        RangeError,
        'rateLimit window exceeds safe time',
      );
      if (isMemKv) assertEquals(memKvWrites, writesBefore);

      // (b) now = M - 3: Req 1 (M-2), Req 2 (M-1), Req 3 denies (retryAt=M-2, resetAt=M-1),
      //     Req 4 at M-2 admits (resetAt=M, expireIn=5_002), Req 5 at M-2 throws RangeError.
      assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 2, now: M - 3 }), {
        allowed: true,
        resetAt: M - 2,
      });
      assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 2, now: M - 3 }), {
        allowed: true,
        resetAt: M - 1,
      });
      assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 2, now: M - 3 }), {
        allowed: false,
        resetAt: M - 1,
        retryAt: M - 2,
      });
      assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 2, now: M - 2 }), {
        allowed: true,
        resetAt: M,
      });
      if (isMemKv) assertEquals(lastMemKvExpireIn, 5_002);
      await assertRejects(
        () => store.consume({ key: 'b', limit: 2, windowMs: 2, now: M - 2 }),
        RangeError,
        'rateLimit window exceeds safe time',
      );

      // (c) now = M throws upfront before any KV IO.
      const readsBefore = memKvReads;
      const writesBeforeUpfront = memKvWrites;
      await assertRejects(
        () => store.consume({ key: 'c', limit: 2, windowMs: 2, now: M }),
        RangeError,
        'rateLimit window exceeds safe time',
      );
      if (isMemKv) {
        assertEquals(memKvReads, readsBefore);
        assertEquals(memKvWrites, writesBeforeUpfront);
      }
    }

    // Deno KV TTL-ceiling gate: MAX_GCRA_TTL_MS commits cleanly; +1 and M-10 reject before any KV IO.
    const ttlMem = createMemoryRateLimitStore({ policy: { kind: 'gcra' } });
    const ttlKvMem = createKvRateLimitStore(memKv, {
      prefix: ['ttl-ceil'],
      policy: { kind: 'gcra' },
    });
    const ttlKvDeno = createKvRateLimitStore(denoKv, {
      prefix: ['ttl-ceil'],
      policy: { kind: 'gcra' },
    });

    for (const store of [ttlMem, ttlKvMem, ttlKvDeno]) {
      assertEquals(
        await store.consume({ key: 'ok', limit: 1, windowMs: 31_535_995_000, now: 1_000 }),
        { allowed: true, resetAt: 31_535_996_000 },
      );
      const rBefore = memKvReads;
      const wBefore = memKvWrites;
      for (const badWindow of [31_535_995_001, M - 10]) {
        await assertRejects(
          () => store.consume({ key: 'bad', limit: 1, windowMs: badWindow, now: 1_000 }),
          RangeError,
          'rateLimit retention exceeds maximum supported TTL',
        );
      }
      assertEquals(memKvReads, rBefore);
      assertEquals(memKvWrites, wBefore);
    }

    // Cross-key backward clock step parity: L=B=1, W=1_000.
    // Admit "a" at 100, consume "b" at 1_100, consume "a" at 1_099 -> denied on BOTH memory and KV.
    const backMem = createMemoryRateLimitStore({ policy: { kind: 'gcra', burst: 1 } });
    const backClock = createClockControlledKv(0);
    const backKv = createKvRateLimitStore(backClock.kv, {
      prefix: ['backstep'],
      policy: { kind: 'gcra', burst: 1 },
    });
    for (const store of [backMem, backKv]) {
      assertEquals(await store.consume({ key: 'a', limit: 1, windowMs: 1_000, now: 100 }), {
        allowed: true,
        resetAt: 1_100,
      });
      if (store === backKv) backClock.advanceBackend(1_000);
      assertEquals(await store.consume({ key: 'b', limit: 1, windowMs: 1_000, now: 1_100 }), {
        allowed: true,
        resetAt: 2_100,
      });
      assertEquals(await store.consume({ key: 'a', limit: 1, windowMs: 1_000, now: 1_099 }), {
        allowed: false,
        resetAt: 1_100,
        retryAt: 1_100,
      });
    }
  } finally {
    await memKv.close();
    await denoKv.close();
  }
});

Deno.test('GCRA Gate 7: memory maxKeys saturation returns advisory fallback and honors 5000ms skew eviction horizon', async () => {
  const store = createMemoryRateLimitStore({ maxKeys: 1, policy: { kind: 'gcra' } });
  // Two admissions at now=0 for limit=2, windowMs=60_000 fill "a" to resetAt=60_000.
  assertEquals(await store.consume({ key: 'a', limit: 2, windowMs: 60_000, now: 0 }), {
    allowed: true,
    resetAt: 30_000,
  });
  assertEquals(await store.consume({ key: 'a', limit: 2, windowMs: 60_000, now: 0 }), {
    allowed: true,
    resetAt: 60_000,
  });

  // New key "b" at now=1 receives advisory fallback without evicting "a".
  assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 60_000, now: 1 }), {
    allowed: false,
    retryAt: 30_001,
    resetAt: 60_001,
  });

  // Retrying "b" at 30_001 or 60_000 (or 64_999) is STILL denied while "a" stays within +5_000ms skew horizon.
  assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 60_000, now: 30_001 }), {
    allowed: false,
    retryAt: 60_001,
    resetAt: 90_001,
  });
  assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 60_000, now: 60_000 }), {
    allowed: false,
    retryAt: 90_000,
    resetAt: 120_000,
  });
  assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 60_000, now: 64_999 }), {
    allowed: false,
    retryAt: 94_999,
    resetAt: 124_999,
  });

  // Once now = 65_000 (resetAt + GCRA_CLOCK_SKEW_BOUND_MS), rotating eviction reclaims "a" and admits "b".
  assertEquals(await store.consume({ key: 'b', limit: 2, windowMs: 60_000, now: 65_000 }), {
    allowed: true,
    resetAt: 95_000,
  });
});

Deno.test('GCRA Gate 8: corrupt KV state, MemoryKv vs DenoKv literal null distinction, and AbortSignal cancellation', async () => {
  await using memKv = new MemoryKvAdapter();
  await using denoKv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const memStore = createKvRateLimitStore(memKv, {
    prefix: ['corrupt'],
    maxAttempts: 2,
    policy: { kind: 'gcra' },
  });
  const denoStore = createKvRateLimitStore(denoKv, {
    prefix: ['corrupt'],
    maxAttempts: 2,
    policy: { kind: 'gcra' },
  });

  const malformedValues: unknown[] = [
    42,
    'bad',
    [],
    { v: 1, tatMs: 100, tatRem: 0 },
    { v: 1, p: 'gcra', tatMs: -1, tatRem: 0 },
    { v: 1, p: 'gcra', tatMs: 100, tatRem: 3 },
    { v: 1, p: 'gcra', tatMs: Number.MAX_SAFE_INTEGER, tatRem: 1 },
  ];

  for (let i = 0; i < malformedValues.length; i++) {
    const keyName = `bad-${i}`;
    const kvKey: KvKey = ['corrupt', 'v1', 'gcra', keyName, 1_000, 3, 3];
    await memKv.set(kvKey, malformedValues[i]);
    await denoKv.set(kvKey, malformedValues[i]);
    await assertRejects(
      () => memStore.consume({ key: keyName, limit: 3, windowMs: 1_000, now: 10 }),
      TypeError,
      'Invalid rate-limit state in KV',
    );
    await assertRejects(
      () => denoStore.consume({ key: keyName, limit: 3, windowMs: 1_000, now: 10 }),
      TypeError,
      'Invalid rate-limit state in KV',
    );
  }

  // Persisted literal `null` distinction:
  // - MemoryKvAdapter returns { value: null, versionstamp } -> throws TypeError.
  // - DenoKvAdapter maps null value to entry === null -> absent-versionstamp CAS fails -> advisory fallback (never admits).
  const nullKvKey: KvKey = ['corrupt', 'v1', 'gcra', 'null-val', 60_000, 3, 3];
  await memKv.set(nullKvKey, null);
  await assertRejects(
    () => memStore.consume({ key: 'null-val', limit: 3, windowMs: 60_000, now: 100 }),
    TypeError,
    'Invalid rate-limit state in KV',
  );

  const rawKv = await denoKv.getRawKv();
  await rawKv.set(nullKvKey, null);
  assertEquals(
    await denoStore.consume({ key: 'null-val', limit: 3, windowMs: 60_000, now: 100 }),
    { allowed: false, retryAt: 20_100, resetAt: 20_100 },
  );

  // AbortSignal checked before IO and between CAS attempts without admitting.
  let getCalls = 0;
  let atomicCalls = 0;
  const controller = new AbortController();
  const baseKv = new MemoryKvAdapter();
  const baseGet = baseKv.get.bind(baseKv);
  baseKv.get = (key) => {
    getCalls++;
    return baseGet(key);
  };
  baseKv.atomic = () => {
    atomicCalls++;
    controller.abort(new Error('mid-cas-abort'));
    return Promise.resolve({ ok: false });
  };
  try {
    const abortStore = createKvRateLimitStore(baseKv, {
      prefix: ['abort'],
      maxAttempts: 4,
      policy: { kind: 'gcra' },
    });
    const preAborted = AbortSignal.abort(new Error('pre-aborted'));
    await assertRejects(
      () =>
        abortStore.consume({
          key: 'k',
          limit: 2,
          windowMs: 1_000,
          now: 0,
          signal: preAborted,
        }),
      Error,
      'pre-aborted',
    );
    assertEquals(getCalls, 0);
    assertEquals(atomicCalls, 0);

    await assertRejects(
      () =>
        abortStore.consume({
          key: 'k',
          limit: 2,
          windowMs: 1_000,
          now: 0,
          signal: controller.signal,
        }),
      Error,
      'mid-cas-abort',
    );
    assertEquals(getCalls, 1);
    assertEquals(atomicCalls, 1);
  } finally {
    await baseKv.close();
  }
});
