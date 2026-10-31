/** Real Redis reproduction in a process with SCAN count configured before import. */

import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { RedisKvAdapter } from '../../redis.ts';
import { WatchBatchQueue } from '../../adapters/redis/watch-batch-queue.ts';
import { REDIS_MGET_BATCH_SIZE, REDIS_SCAN_COUNT } from '../../adapters/redis/types.ts';
import type { KvKey } from '../../mod.ts';

assertEquals(REDIS_SCAN_COUNT, 16);
const namespace = `paging-${crypto.randomUUID()}`;
const prefix = ['reproduction'];
const keyCount = 97;
const expected = Array.from(
  { length: keyCount },
  (_, i) => [...prefix, `k${String(i).padStart(4, '0')}`],
);
const kv = new RedisKvAdapter({ url: Deno.env.get('NETSCRIPT_TEST_REDIS_URL'), namespace });
let scanCalls = 0;
let scanCycles = 0;
const send = Redis.prototype.sendCommand;
using _observed = stub(Redis.prototype, 'sendCommand', function (command, ...args) {
  if (command.name === 'scan') {
    scanCalls++;
    if (command.args[0] === '0') scanCycles++;
  }
  return send.call(this, command, ...args);
});

try {
  for (const key of expected.toReversed()) await kv.set(key, key.at(-1));
  let scanCallsForFirstPage = 0;
  for (const limit of [1, 32]) {
    const actual: KvKey[] = [];
    let start: KvKey | undefined;
    for (let attempt = 0; attempt <= keyCount; attempt++) {
      const before = scanCalls;
      const page = [];
      for await (const entry of kv.list({ prefix, start, limit })) page.push(entry.key);
      if (limit === 32 && attempt === 0) scanCallsForFirstPage = scanCalls - before;
      if (page.length === 0) break;
      assertEquals(page, expected.slice(actual.length, actual.length + limit));
      assert(!start || JSON.stringify(start) < JSON.stringify(page[0]), 'cursor must advance');
      actual.push(...page);
      start = page.at(-1);
      assert(actual.length <= keyCount);
    }
    assertEquals(actual, expected);
  }
  assert(scanCallsForFirstPage >= 2, 'adapter must traverse multiple actual Redis SCAN replies');

  // Exercise the actual watch path, not just its helper, with more than one ordered window.
  for (let i = keyCount; i <= REDIS_MGET_BATCH_SIZE + 17; i++) {
    const name = `k${String(i).padStart(4, '0')}`;
    await kv.set([...prefix, name], name);
  }
  const abort = new AbortController();
  const waiting = Promise.withResolvers<void>();
  const polled = Promise.withResolvers<void>();
  let waits = 0;
  const next = WatchBatchQueue.prototype.next;
  using _parked = stub(WatchBatchQueue.prototype, 'next', function (...args) {
    if (++waits === 1) waiting.resolve();
    else polled.resolve();
    return next.apply(this, args);
  });
  scanCycles = 0;
  const iterator = kv.watchPrefix(prefix, {
    skipInitial: true,
    signal: abort.signal,
    pollInterval: 20,
  })[Symbol.asyncIterator]();
  const pending = iterator.next();
  try {
    await deadline(waiting.promise, 5_000);
    assertEquals(scanCycles, 1, 'watch baseline must use a single full scan');
    await deadline(polled.promise, 5_000);
    assertEquals(scanCycles, 2, 'watch poll must add exactly one full scan');
  } finally {
    abort.abort();
    await pending;
    await iterator.return?.();
  }
  console.log(
    JSON.stringify({
      keys: keyCount,
      pageSizes: [1, 32],
      scanCallsForFirstPage,
      watchDiscoveryCycles: 1,
      watchPollCycles: scanCycles - 1,
    }),
  );
} finally {
  await kv.close();
}
