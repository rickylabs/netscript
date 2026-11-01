/** The Deno-compatible bridge must translate the portable store's exclusive start. */

import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter, MemoryKvAdapter, type WatchableKv } from '../mod.ts';
import { RedisKvAdapter } from '../redis.ts';
import { WatchableKvBridge } from '../adapters/denokv-bridge.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const PREFIX = ['bridge-list'];
const KEYS = ['a', 'b', 'c'].map((part) => [...PREFIX, part]);
const adapters: {
  name: string;
  make: () => WatchableKv | Promise<WatchableKv>;
  ignore?: boolean;
}[] = [
  { name: 'memory', make: () => new MemoryKvAdapter() },
  { name: 'Deno KV', make: async () => new DenoKvAdapter(await Deno.openKv(':memory:')) },
  {
    name: 'Redis',
    ignore: !redisUrl,
    make: () =>
      new RedisKvAdapter({ url: redisUrl, namespace: `bridge-list-${crypto.randomUUID()}` }),
  },
];

async function keys(
  entries: AsyncIterable<{ key: readonly Deno.KvKeyPart[] }>,
): Promise<Deno.KvKey[]> {
  const result: Deno.KvKey[] = [];
  for await (const entry of entries) result.push(entry.key);
  return result;
}

for (const adapter of adapters) {
  Deno.test({
    name: `bridge list: ${adapter.name} preserves native inclusive start, limits and reverse`,
    ignore: adapter.ignore,
    async fn() {
      const store = await adapter.make();
      const native = await Deno.openKv(':memory:');
      const bridge = new WatchableKvBridge(store);
      try {
        for (const key of [PREFIX, ...KEYS]) {
          await store.set(key, key.at(-1));
          await native.set(key, key.at(-1));
        }
        for (const start of [KEYS[0], KEYS[1], [...PREFIX, 'bb'], [...PREFIX, 'z']]) {
          for (const reverse of [false, true]) {
            for (const limit of [undefined, 1, 2, 10]) {
              const selector = { prefix: PREFIX, start };
              const options = { reverse, limit };
              assertEquals(
                await keys(bridge.list(selector, options)),
                await keys(native.list(selector, options)),
                `start=${start.at(-1)} reverse=${reverse} limit=${limit}`,
              );
            }
          }
        }

        for (const reverse of [false, true]) {
          const selector = { prefix: PREFIX, start: KEYS[0] };
          const expected = await keys(native.list(selector, { reverse }));
          const actual: Deno.KvKey[] = [];
          let cursor: string | undefined;
          for (let attempt = 0; attempt <= KEYS.length; attempt++) {
            const iterator = bridge.list(selector, { reverse, limit: 1, cursor });
            const page = await keys(iterator);
            if (page.length === 0) break;
            assertEquals(page, expected.slice(actual.length, actual.length + 1));
            actual.push(...page);
            assert(!cursor || cursor !== iterator.cursor, 'bridge cursor must advance');
            cursor = iterator.cursor;
          }
          assertEquals(actual, expected);
        }
      } finally {
        native.close();
        await bridge.close();
      }
    },
  });
}
