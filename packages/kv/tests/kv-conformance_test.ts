/**
 * Runs the shared KV port contracts against the memory and Redis adapters.
 *
 * The Redis half needs `NETSCRIPT_TEST_REDIS_URL` (CI provides a Redis
 * service); each scenario gets its own namespace.
 */

import { assert, assertEquals } from '@std/assert';
import { deadline, delay } from '@std/async';
import { RedisKvAdapter } from '../redis.ts';
import {
  createMemoryKvAdapter,
  runAtomicKvStoreContract,
  runKvStoreContract,
  runWatchableKvContract,
  type WatchableKv,
} from '../src/testing/mod.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

const adapters: { name: string; make: () => WatchableKv; ignore?: boolean }[] = [
  { name: 'MemoryKvAdapter contract', make: createMemoryKvAdapter },
  {
    name: 'RedisKvAdapter contract',
    ignore: !redisUrl,
    make: () => new RedisKvAdapter({ url: redisUrl, namespace: `contract-${crypto.randomUUID()}` }),
  },
];

for (const adapter of adapters) {
  runKvStoreContract(adapter);
  runAtomicKvStoreContract(adapter);
  runWatchableKvContract(adapter);

  Deno.test({
    name: `${adapter.name}: watch events carry the atomic commit versionstamp and combined value`,
    ignore: adapter.ignore,
    async fn() {
      const kv = adapter.make();
      const controller = new AbortController();
      const key = ['contract', 'watch', 'counter'];
      const iterator = kv.watch<bigint>([key], { signal: controller.signal })
        [Symbol.asyncIterator]();

      try {
        const pending = iterator.next();
        await delay(100);
        await kv.set(key, 5n);
        const seeded = await deadline(pending, 2_000);
        assert(!seeded.done);

        const result = await kv.atomic!([], [{ type: 'sum', key, value: 3n }]);
        assert(result.ok);
        const batch = await deadline(iterator.next(), 2_000);
        assert(!batch.done);
        assertEquals(batch.value.map((event) => event.value), [8n]);
        assertEquals(batch.value[0].versionstamp, result.versionstamp);
      } finally {
        controller.abort();
        await kv.set(key, 0n);
        await deadline(Promise.resolve(iterator.return?.()), 2_000);
        await kv.close();
      }
    },
  });
}
