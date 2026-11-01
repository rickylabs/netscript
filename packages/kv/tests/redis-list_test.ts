import { assert, assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';
import { BinaryHeap } from '@std/data-structures';
import type { Redis } from 'ioredis';
import { listEntries, scanEntries } from '../adapters/redis/list-entries.ts';
import { REDIS_MGET_BATCH_SIZE } from '../adapters/redis/types.ts';
import { keyToRedisKey } from '../adapters/redis/serialization.ts';
import type { KvKey } from '../mod.ts';

const NAMESPACE = 'list-test';
const PREFIX = ['entries'];
const KEY_COUNT = REDIS_MGET_BATCH_SIZE * 3 + 17;
const KEYS = Array.from({ length: KEY_COUNT }, (_, i) => [
  ...PREFIX,
  `k${String(i).padStart(5, '0')}`,
]);

function fixture(keys: KvKey[] = KEYS) {
  const names = keys.map((key) => keyToRedisKey(key, NAMESPACE));
  // First SCAN reply contains large keys; later replies contain globally earlier ones.
  const batches = [
    names.filter((_, i) => i % 3 === 2).toReversed(),
    [],
    names.filter((_, i) => i % 3 === 1),
    names.filter((_, i) => i % 3 === 0),
    [names.at(-1)!, names[0], names[0]],
  ];
  const data = new Map<string, string | null>(
    names.map((name, i) => [name, JSON.stringify({ value: keys[i], versionstamp: `v${i}` })]),
  );
  const calls = { scans: 0, cycles: 0, mget: [] as string[][] };
  const client: Pick<Redis, 'scan' | 'mget'> = {
    scan: (cursor) => {
      calls.scans++;
      if (String(cursor) === '0') calls.cycles++;
      const index = Number(cursor);
      return Promise.resolve([
        index + 1 === batches.length ? '0' : String(index + 1),
        batches[index],
      ]);
    },
    mget: (...args) => {
      const requested = args.map(String);
      calls.mget.push(requested);
      return Promise.resolve(requested.map((key) => data.get(key) ?? null));
    },
  };
  return { client, calls, data, names };
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of source) values.push(value);
  return values;
}

Deno.test('Redis list selects one global limited page across unordered/duplicate/empty SCAN batches', async () => {
  for (const reverse of [false, true]) {
    const { client, calls } = fixture();
    const result = await collect(
      listEntries(client, NAMESPACE, { prefix: PREFIX, limit: 32, reverse }),
    );
    assertEquals(
      result.map((entry) => entry.key),
      (reverse ? KEYS.toReversed() : KEYS).slice(0, 32),
    );
    assertEquals(calls.scans, 5, 'must finish SCAN even though first reply exceeds the limit');
    assertEquals(calls.cycles, 1);
    assertEquals(calls.mget.map((keys) => keys.length), [32]);
  }
});

Deno.test('Redis list bounds retained heap and MGET windows for unlimited forward/reverse iteration', async () => {
  for (const reverse of [false, true]) {
    const { client, calls } = fixture();
    let maximumHeap = 0;
    const push = BinaryHeap.prototype.push;
    using _observed = stub(BinaryHeap.prototype, 'push', function (...values) {
      const result = push.apply(this, values);
      maximumHeap = Math.max(maximumHeap, this.length);
      return result;
    });
    const entries = await collect(listEntries(client, NAMESPACE, { prefix: PREFIX, reverse }));
    assertEquals(entries.map((entry) => entry.key), reverse ? KEYS.toReversed() : KEYS);
    assertEquals(calls.cycles, Math.ceil(KEY_COUNT / REDIS_MGET_BATCH_SIZE));
    assert(maximumHeap <= REDIS_MGET_BATCH_SIZE);
    assert(calls.mget.every((keys) => keys.length <= REDIS_MGET_BATCH_SIZE));
    assertEquals(calls.mget.flat().length, KEY_COUNT);
  }
});

Deno.test('Redis fractional numeric limits cannot bypass the heap or MGET cap', async () => {
  const { client, calls } = fixture();
  let maximumHeap = 0;
  const push = BinaryHeap.prototype.push;
  using _observed = stub(BinaryHeap.prototype, 'push', function (...values) {
    const result = push.apply(this, values);
    maximumHeap = Math.max(maximumHeap, this.length);
    return result;
  });
  const entries = await collect(listEntries(client, NAMESPACE, { prefix: PREFIX, limit: 32.5 }));
  assertEquals(entries.length, 33);
  assertEquals(maximumHeap, 33);
  assertEquals(calls.mget.map((keys) => keys.length), [33]);
});

Deno.test('Redis list refills after missing/malformed values without losing its exclusive boundary', async () => {
  const { client, data, names } = fixture(KEYS.slice(0, 8));
  data.set(names[0], null);
  data.set(names[1], 'not json');
  data.set(names[3], 'null');
  const entries = await collect(listEntries(client, NAMESPACE, { prefix: PREFIX, limit: 3 }));
  assertEquals(entries.map((entry) => entry.key), [KEYS[2], KEYS[4], KEYS[5]]);
  data.set(names[4], null);
  const reverse = await collect(listEntries(client, NAMESPACE, {
    prefix: PREFIX,
    reverse: true,
    start: KEYS[1],
    end: KEYS[6],
    limit: 3,
  }));
  assertEquals(reverse.map((entry) => entry.key), [KEYS[5], KEYS[2]]);
});

Deno.test('Redis list uses the same key comparison for nested ordering and exclusive bounds', async () => {
  const keys = [[...PREFIX, 'a'], [...PREFIX, 'a', 'child'], [...PREFIX, 'b']];
  const { client } = fixture(keys);
  const entries = await collect(listEntries(client, NAMESPACE, {
    prefix: PREFIX,
    start: keys[0],
    end: keys[2],
  }));
  assertEquals(entries.map((entry) => entry.key), [keys[1]]);
});

Deno.test('Redis list stops fetching after consumer return and does no work for a zero limit', async () => {
  const { client, calls } = fixture();
  for await (const _ of listEntries(client, NAMESPACE, { prefix: PREFIX })) break;
  assertEquals(calls.cycles, 1);
  assertEquals(calls.mget.length, 1);
  assertEquals(await collect(listEntries(client, NAMESPACE, { prefix: PREFIX, limit: 0 })), []);
  assertEquals(calls.cycles, 1);
});

Deno.test('Redis watch discovery scans once even for a prefix larger than an output window', async () => {
  const { client, calls } = fixture();
  const entries = await collect(scanEntries(client, NAMESPACE, PREFIX));
  assertEquals(new Set(entries.map((entry) => JSON.stringify(entry.key))).size, KEY_COUNT);
  assertEquals(calls.cycles, 1);
  assertEquals(calls.scans, 5);
  assert(calls.mget.every((keys) => keys.length <= REDIS_MGET_BATCH_SIZE));
});

Deno.test({
  name: 'Redis list reproduces limit-1/32 paging over multiple real SCAN batches',
  ignore: !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
  async fn() {
    // The subprocess sets COUNT before module loading, independently of test import order.
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-all',
        '--unstable-kv',
        new URL('./fixtures/redis-list-reproduction.ts', import.meta.url).pathname,
      ],
      env: { REDIS_SCAN_BATCH_SIZE: '16' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    const proof = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(proof.keys, 97);
    assert(proof.scanCallsForFirstPage >= 2);
    assertEquals(proof.pageSizes, [1, 32]);
    assertEquals(proof.watchDiscoveryCycles, 1);
    assertEquals(proof.watchPollCycles, 1);
  },
});
