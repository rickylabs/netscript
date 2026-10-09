import { assertEquals, assertThrows } from '@std/assert';
import { delay } from '@std/async';
import { decodeRedisJson, encodeRedisJson } from '../adapters/redis/codec.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';

Deno.test('Redis codec round-trips bigint values at any depth', () => {
  const value = { total: 9007199254740993n, nested: [1n, 'x', null], plain: 1 };
  assertEquals(decodeRedisJson(encodeRedisJson(value)), value);
  assertEquals(decodeRedisJson<bigint>(encodeRedisJson(-8n)), -8n);
});

Deno.test('Redis codec reads envelopes written as plain JSON unchanged', () => {
  const legacy = JSON.stringify({ value: { '$kv:bigint': 'x', other: 1 }, versionstamp: 'v1' });
  assertEquals(decodeRedisJson(legacy), {
    value: { '$kv:bigint': 'x', other: 1 },
    versionstamp: 'v1',
  });
  assertThrows(() => decodeRedisJson('not json'), SyntaxError);
});

Deno.test('WatchBatchQueue hands out already-queued events without waiting', async () => {
  const queue = new WatchBatchQueue<string>();
  queue.push('a');
  queue.push('b');
  assertEquals(await queue.next(), ['a', 'b']);
});

Deno.test('WatchBatchQueue coalesces events inside the debounce window', async () => {
  const queue = new WatchBatchQueue<string>();
  const batch = queue.next(40);
  queue.push('a');
  await delay(10);
  queue.push('b');
  assertEquals(await batch, ['a', 'b']);
});

Deno.test('WatchBatchQueue keeps events queued after an earlier debounced batch', async () => {
  const queue = new WatchBatchQueue<string>();
  const first = queue.next(20);
  queue.push('a');
  assertEquals(await first, ['a']);

  queue.push('b');
  await delay(60);
  assertEquals(await queue.next(20), ['b']);
});

Deno.test('WatchBatchQueue resolves a pending wait with an empty batch on abort', async () => {
  const queue = new WatchBatchQueue<string>();
  const controller = new AbortController();
  const batch = queue.next(undefined, controller.signal);
  controller.abort();
  assertEquals(await batch, []);
  queue.push('late');
  assertEquals(await queue.next(), ['late']);
});
