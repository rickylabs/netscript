import { assertEquals, assertThrows } from '@std/assert';
import { deadline, delay } from '@std/async';
import { decodeEnvelope, encodeEnvelope, encodeStoredValue } from '../adapters/redis/codec.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';
import { BIGINT_VALUES, MARKER_SHAPED_VALUES } from '../src/testing/values.ts';

Deno.test('Redis codec round-trips bigint values at any depth', () => {
  for (const value of BIGINT_VALUES) {
    assertEquals(decodeEnvelope(encodeStoredValue(value, 'v1')), { value, versionstamp: 'v1' });
  }
  const key = ['counters', 7n];
  assertEquals(decodeEnvelope(encodeEnvelope({ key, value: null })), { key, value: null });
});

Deno.test('Redis codec never reinterprets marker-shaped user values', () => {
  for (const value of MARKER_SHAPED_VALUES) {
    const encoded = encodeStoredValue(value, 'v1');
    assertEquals(encoded, JSON.stringify({ value, versionstamp: 'v1' }));
    assertEquals(decodeEnvelope(encoded), { value, versionstamp: 'v1' });
  }
});

Deno.test('Redis codec reads plain-JSON envelopes written before it unchanged', () => {
  const legacy = JSON.stringify({ value: { '$kv:bigint': '123', n: 1 }, versionstamp: 'v0' });
  assertEquals(decodeEnvelope(legacy), {
    value: { '$kv:bigint': '123', n: 1 },
    versionstamp: 'v0',
  });
  assertThrows(() => decodeEnvelope('not json'), SyntaxError);
  assertThrows(() => decodeEnvelope('{"value":"x","bigints":[["value"]]}'), TypeError);
  assertThrows(
    () => decodeEnvelope('{"value":{},"bigints":[["value","__proto__","toString"]]}'),
    TypeError,
  );
});

Deno.test('Redis codec keeps a bigint under a user key named __proto__', () => {
  const value = JSON.parse('{"__proto__":0}') as Record<string, unknown>;
  value['n'] = 1n;
  Object.defineProperty(value, '__proto__', { value: 2n, enumerable: true });
  const decoded = decodeEnvelope<{ value: Record<string, unknown> }>(
    encodeStoredValue(value, 'v1'),
  ).value;
  assertEquals(Object.getOwnPropertyDescriptor(decoded, '__proto__')?.value, 2n);
  assertEquals(decoded.n, 1n);
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

Deno.test('WatchBatchQueue ends an active debounce window on abort', async () => {
  const queue = new WatchBatchQueue<string>();
  const controller = new AbortController();
  const batch = queue.next(1_000, controller.signal);
  queue.push('a');
  await delay(10);
  controller.abort();
  assertEquals(await deadline(batch, 100), []);
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
