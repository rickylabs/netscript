import { CacheQuery } from '../../src/cache/cache-query.ts';
import type { CacheEntry } from '../../src/ports/cache-entry.ts';
import { assertEquals, MemoryCacheStore, nextTurn } from '../test-helpers.ts';

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
