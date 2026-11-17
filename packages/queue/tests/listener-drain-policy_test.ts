import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { spy } from '@std/testing/mock';
import { MemoryKvAdapter } from '@netscript/kv';
import { redisListenerPolicy } from '../adapters/_redis-lease-state.ts';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { QueueError } from '../ports/errors.ts';

Deno.test('listener drain policy validates before resources and keeps the old default', async () => {
  assertEquals(redisListenerPolicy({ visibilityTimeout: 123 }).drainTimeout, 123);
  assertEquals(redisListenerPolicy({ drainTimeoutMs: Infinity }).drainTimeout, Infinity);
  assertEquals(redisListenerPolicy({ drainTimeoutMs: 456 }).drainTimeout, 456);
  await using kv = new MemoryKvAdapter();
  const queue = new KvPollingAdapter({ kv });
  using intervals = spy(globalThis, 'setInterval');
  for (const drainTimeoutMs of [NaN, -Infinity, -1, 0, 1.5, 2_147_483_648]) {
    assertThrows(() => redisListenerPolicy({ drainTimeoutMs }), QueueError);
    await assertRejects(
      () => queue.listen(() => Promise.resolve(), { drainTimeoutMs }),
      QueueError,
    );
  }
  assertEquals(intervals.calls.length, 0);
  const cancelled = new AbortController();
  cancelled.abort();
  await queue.listen(() => Promise.resolve(), {
    signal: cancelled.signal,
    drainTimeoutMs: Infinity,
  });
  await queue.stop();
});
