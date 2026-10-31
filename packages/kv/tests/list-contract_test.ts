/** One listing contract, run unchanged against each first-party adapter. */

import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter, MemoryKvAdapter } from '../mod.ts';
import { RedisKvAdapter } from '../redis.ts';
import type { KvKey, KvListOptions, KvStore } from '../mod.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const PREFIX = ['list-contract'];
const KEY_COUNT = 97;
const KEYS = Array.from({ length: KEY_COUNT }, (_, index) => [
  ...PREFIX,
  `k${String(index).padStart(4, '0')}`,
]);
const PAGE_SIZES = [1, 32];

const adapters: { name: string; make: () => KvStore | Promise<KvStore>; ignore?: boolean }[] = [
  { name: 'memory', make: () => new MemoryKvAdapter() },
  { name: 'Deno KV', make: async () => new DenoKvAdapter(await Deno.openKv(':memory:')) },
  {
    name: 'Redis',
    ignore: !redisUrl,
    make: () => new RedisKvAdapter({ url: redisUrl, namespace: `list-${crypto.randomUUID()}` }),
  },
];

async function keys(kv: KvStore, options: KvListOptions): Promise<KvKey[]> {
  const result: KvKey[] = [];
  for await (const entry of kv.list(options)) {
    assertEquals(entry.value, entry.key.at(-1));
    assert(entry.versionstamp);
    result.push(entry.key);
  }
  return result;
}

for (const adapter of adapters) {
  Deno.test({
    name: `list contract: ${adapter.name}: bounds, prefix, limit, reverse and cursor paging`,
    ignore: adapter.ignore,
    async fn(t) {
      const kv = await adapter.make();
      try {
        // Scramble insertion order independently of the expected global order.
        for (const key of [...KEYS.filter((_, i) => i % 2), ...KEYS.filter((_, i) => !(i % 2))]) {
          await kv.set(key, key.at(-1));
        }
        await kv.set(PREFIX, 'prefix key must not be listed');
        await kv.set(['list-contract-sibling', 'k0000'], 'sibling');

        await t.step('global order and prefix excludes exact key and sibling', async () => {
          assertEquals(await keys(kv, { prefix: PREFIX }), KEYS);
          assertEquals(await keys(kv, { prefix: ['missing'] }), []);
          await kv.set([...PREFIX, 'nested', 'leaf'], 'leaf');
          assertEquals(await keys(kv, { prefix: [...PREFIX, 'nested'] }), [[
            ...PREFIX,
            'nested',
            'leaf',
          ]]);
          await kv.delete([...PREFIX, 'nested', 'leaf']);
        });

        await t.step('exclusive bounds and limits apply in either direction', async () => {
          for (const reverse of [false, true]) {
            const ordered = (range: KvKey[]) => reverse ? range.toReversed() : range;
            assertEquals(await keys(kv, { prefix: PREFIX, reverse }), ordered(KEYS));
            assertEquals(
              await keys(kv, { prefix: PREFIX, start: KEYS[1], reverse }),
              ordered(KEYS.slice(2)),
            );
            assertEquals(
              await keys(kv, { prefix: PREFIX, end: KEYS[5], reverse }),
              ordered(KEYS.slice(0, 5)),
            );
            assertEquals(
              await keys(kv, { prefix: PREFIX, start: KEYS[1], end: KEYS[5], reverse, limit: 2 }),
              ordered(KEYS.slice(2, 5)).slice(0, 2),
            );
            assertEquals(await keys(kv, { prefix: PREFIX, limit: 0, reverse }), []);
            assertEquals(
              await keys(kv, { prefix: PREFIX, start: KEYS[5], end: KEYS[1], reverse }),
              [],
            );
            assertEquals(
              await keys(kv, { prefix: PREFIX, start: KEYS[5], end: KEYS[5], reverse }),
              [],
            );
          }
        });

        await t.step('bounds outside prefix remain valid ranges', async () => {
          for (const reverse of [false, true]) {
            assertEquals(
              await keys(kv, { prefix: PREFIX, start: ['aaa'], end: ['zzz'], reverse }),
              reverse ? KEYS.toReversed() : KEYS,
            );
            assertEquals(await keys(kv, { prefix: PREFIX, start: ['zzz'], reverse }), []);
            assertEquals(await keys(kv, { prefix: PREFIX, end: ['aaa'], reverse }), []);
          }
        });

        for (const limit of PAGE_SIZES) {
          await t.step(
            `forward cursor pages of ${limit} advance without gaps/repeats`,
            async () => {
              const actual: KvKey[] = [];
              let start: KvKey | undefined;
              for (let attempt = 0; attempt <= KEY_COUNT; attempt++) {
                const page = await keys(kv, { prefix: PREFIX, start, limit });
                if (page.length === 0) break;
                assert(page.length <= limit);
                assertEquals(page, KEYS.slice(actual.length, actual.length + limit));
                actual.push(...page);
                start = page.at(-1);
                assert(actual.length <= KEY_COUNT, 'cursor must advance');
              }
              assertEquals(actual, KEYS);
            },
          );
        }

        await t.step('reverse cursor advances by the exclusive end bound', async () => {
          const actual: KvKey[] = [];
          let end: KvKey | undefined;
          for (let attempt = 0; attempt <= KEY_COUNT; attempt++) {
            const page = await keys(kv, { prefix: PREFIX, end, reverse: true, limit: 32 });
            if (page.length === 0) break;
            assertEquals(page, KEYS.toReversed().slice(actual.length, actual.length + 32));
            actual.push(...page);
            end = page.at(-1);
            assert(actual.length <= KEY_COUNT);
          }
          assertEquals(actual, KEYS.toReversed());
        });

        await t.step('prefix is literal even with Redis glob metacharacters', async () => {
          const literal = ['literal*?[x]\\'];
          await kv.set([...literal, 'key'], 'key');
          await kv.set(['literal-other', 'key'], 'other');
          assertEquals(await keys(kv, { prefix: literal }), [[...literal, 'key']]);
        });
      } finally {
        await kv.close();
      }
    },
  });
}

Deno.test('Deno listing preserves native typed bounds while excluding only the exact start', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const prefix = [new Uint8Array([1, 2]), 'typed'];
    const keyParts = [9, 10, 9n, 10n];
    for (const part of keyParts) await kv.set([...prefix, part], part);
    const entries = [];
    for await (
      const entry of kv.list({
        prefix,
        start: [new Uint8Array([1, 2]), 'typed', 9],
        limit: 3,
      })
    ) entries.push(entry.key.at(-1));
    assertEquals(entries, [10]);
    const bigint = [];
    for await (
      const entry of kv.list({ prefix, start: [...prefix, 9n], limit: 3 })
    ) bigint.push(entry.key.at(-1));
    assertEquals(bigint, [10n, 9, 10]);
    const reverse = [];
    for await (const entry of kv.list({ prefix, end: [...prefix, 10], reverse: true })) {
      reverse.push(entry.key.at(-1));
    }
    assertEquals(reverse, [9, 10n, 9n]);
  } finally {
    await kv.close();
  }
});
