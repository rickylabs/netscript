import { assertEquals } from '@std/assert';
import { CacheOutcomes, CacheTiers } from '@netscript/telemetry/attributes';
import {
  getCacheProvider,
  resetCacheProvider,
  setCacheProvider,
} from '../../src/cache/cache-provider.ts';
import { CacheQuery } from '../../src/cache/cache-query.ts';
import { MemoryCacheStore } from '../test-helpers.ts';

Deno.test('MemoryCacheStore returns required lookup, write, and invalidation evidence', async () => {
  const store = new MemoryCacheStore();
  const key: Deno.KvKey = ['cache_query', 'orders'];

  const miss = await store.get<string>(key);
  assertEquals(miss.value, null);
  assertEquals(miss.report, {
    lookups: [{
      system: 'memory',
      tier: CacheTiers.L1,
      lookupIndex: 0,
      outcome: CacheOutcomes.MISS,
    }],
    promotions: [],
    topologyComplete: true,
  });

  const write = await store.set(key, 'cached', { expireIn: 60_000 });
  assertEquals(write, {
    writes: [{ system: 'memory', tier: CacheTiers.L1, writeThrough: false }],
    promotions: [],
    topologyComplete: true,
  });

  const hit = await store.get<string>(key);
  assertEquals(hit.value, 'cached');
  assertEquals(hit.report.lookups[0].outcome, CacheOutcomes.HIT);

  const invalidation = await store.delete(key);
  assertEquals(invalidation, {
    invalidations: [{ system: 'memory', tier: CacheTiers.L1 }],
    topologyComplete: true,
  });
});

Deno.test('setCacheProvider stores a package-owned forwarding boundary', () => {
  const provider = new CacheQuery(new MemoryCacheStore());
  setCacheProvider(provider);

  const registered = getCacheProvider();
  assertEquals(registered === provider, false);
  assertEquals(registered.descriptor, { system: 'memory', tier: CacheTiers.L1 });

  resetCacheProvider();
});
