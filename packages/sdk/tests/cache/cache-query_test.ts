import { CacheQuery } from '../../src/cache/cache-query.ts';
import type { CacheEntry } from '../../src/ports/cache-entry.ts';
import type { CacheKey } from '../../src/ports/cache-store.ts';
import type { CacheWriteTopologyReport } from '../../src/ports/cache-topology.ts';
import { assert, assertEquals, MemoryCacheStore, nextTurn } from '../test-helpers.ts';

class RejectingWriteCacheStore extends MemoryCacheStore {
  override set(
    _key: CacheKey,
    _value: unknown,
    _options?: { expireIn?: number },
  ): Promise<CacheWriteTopologyReport> {
    return Promise.reject(new Error('cache write failed'));
  }
}

class JoinObservedInflightMap extends Map<string, Promise<unknown>> {
  readonly joined = Promise.withResolvers<void>();
  observeJoins = false;

  override get(key: string): Promise<unknown> | undefined {
    const operation = super.get(key);
    if (this.observeJoins && operation) {
      this.joined.resolve();
    }
    return operation;
  }
}

Deno.test('CacheQuery returns stale data while revalidating in the background', async () => {
  const store = new MemoryCacheStore();
  const cache = new CacheQuery(store);
  store.setRaw(
    ['cache_query', 'orders'],
    {
      data: 'stale',
      timestamp: Date.now() - 100,
    } satisfies CacheEntry<string>,
  );

  const result = await cache.query(['orders'], {
    staleTime: 1,
    cacheTime: 10_000,
    queryFn: () => Promise.resolve('fresh'),
  });

  assertEquals(result, 'stale');
  await nextTurn();
  assertEquals(await cache.getCachedData(['orders']), 'fresh');
});

Deno.test('CacheQuery preferFreshOnStale blocks for a fresh result', async () => {
  const store = new MemoryCacheStore();
  const cache = new CacheQuery(store);
  store.setRaw(
    ['cache_query', 'orders'],
    {
      data: 'stale',
      timestamp: Date.now() - 100,
    } satisfies CacheEntry<string>,
  );

  const result = await cache.query(['orders'], {
    staleTime: 1,
    cacheTime: 10_000,
    preferFreshOnStale: true,
    queryFn: () => Promise.resolve('fresh'),
  });

  assertEquals(result, 'fresh');
  assertEquals(await cache.getCachedData(['orders']), 'fresh');
});

Deno.test('CacheQuery deduplicates in-flight fetches per instance', async () => {
  const store = new MemoryCacheStore();
  const inflight = new Map<string, Promise<unknown>>();
  const cache = new CacheQuery(store, inflight);
  let calls = 0;

  const queryFn = async (): Promise<string> => {
    calls += 1;
    await nextTurn();
    return 'fresh';
  };

  const [first, second] = await Promise.all([
    cache.query(['orders'], { queryFn }),
    cache.query(['orders'], { queryFn }),
  ]);

  assertEquals(first, 'fresh');
  assertEquals(second, 'fresh');
  assertEquals(calls, 1);
  assertEquals(inflight.size, 0);
});

Deno.test('CacheQuery shares one background refresh across overlapping stale readers', async () => {
  const store = new MemoryCacheStore();
  const inflight = new Map<string, Promise<unknown>>();
  const cache = new CacheQuery(store, inflight);
  const refresh = Promise.withResolvers<void>();
  const staleTimestamp = Date.now() - 100;
  let calls = 0;
  store.setRaw(
    ['cache_query', 'orders'],
    {
      data: 'stale',
      timestamp: staleTimestamp,
    } satisfies CacheEntry<string>,
  );

  const queryFn = async (): Promise<string> => {
    calls += 1;
    await refresh.promise;
    return 'fresh';
  };
  const options = {
    staleTime: 1,
    cacheTime: 10_000,
    queryFn,
  };

  const first = await cache.query(['orders'], options);
  const registeredRefresh = inflight.get('["orders"]');
  const second = await cache.query(['orders'], options);

  assert(
    registeredRefresh,
    'background refresh must be registered before the stale reader returns',
  );
  assertEquals(first, 'stale');
  assertEquals(second, 'stale');
  assertEquals(calls, 1);
  assertEquals(inflight.size, 1);

  refresh.resolve();
  await registeredRefresh;

  const entry = await cache.getCachedEntry<string>(['orders']);
  assert(entry, 'the shared refresh must persist a cache entry');
  assertEquals(entry.data, 'fresh');
  assert(entry.cachedAt > staleTimestamp, 'the shared refresh must persist a current timestamp');
  assertEquals(inflight.size, 0);
});

Deno.test('CacheQuery blocking joiner receives data when background persistence fails', async () => {
  const store = new RejectingWriteCacheStore();
  const inflight = new JoinObservedInflightMap();
  const cache = new CacheQuery(store, inflight);
  const refresh = Promise.withResolvers<void>();
  let calls = 0;
  store.setRaw(
    ['cache_query', 'orders'],
    {
      data: 'stale',
      timestamp: Date.now() - 100,
    } satisfies CacheEntry<string>,
  );

  const queryFn = async (): Promise<string> => {
    calls += 1;
    await refresh.promise;
    return 'fresh';
  };
  const stale = await cache.query(['orders'], {
    staleTime: 1,
    cacheTime: 10_000,
    queryFn,
  });
  assertEquals(stale, 'stale');

  inflight.observeJoins = true;
  const joiner = cache.query(['orders'], {
    staleTime: 1,
    cacheTime: 10_000,
    preferFreshOnStale: true,
    queryFn,
  });
  await inflight.joined.promise;
  assertEquals(calls, 1);

  refresh.resolve();

  assertEquals(await joiner, 'fresh');
  assertEquals(await cache.getCachedData<string>(['orders']), 'stale');
  assertEquals(calls, 1);
  assertEquals(inflight.size, 0);
});
