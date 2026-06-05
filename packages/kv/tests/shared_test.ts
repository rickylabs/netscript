import { assert, assertEquals, assertNotStrictEquals, assertStrictEquals } from '@std/assert';
import { closeKv, getActiveProvider, getKv, getRawKv, isKvInitialized, resetKv } from '../mod.ts';

Deno.test('shared KV lifecycle reuses and resets the singleton', async () => {
  await resetKv();

  const first = await getKv({
    path: ':memory:',
    provider: 'deno-kv',
    skipServiceDiscovery: true,
  });
  const second = await getKv();

  assertStrictEquals(first, second);
  assertEquals(getActiveProvider(), 'deno-kv');
  assert(isKvInitialized());

  const rawKv = await getRawKv();
  await rawKv.set(['shared', 'value'], 1);
  assertEquals((await first.get<number>(['shared', 'value']))?.value, 1);

  await closeKv();
  assertEquals(isKvInitialized(), false);

  const third = await getKv({
    path: ':memory:',
    provider: 'deno-kv',
    skipServiceDiscovery: true,
  });
  assertNotStrictEquals(third, first);

  await resetKv();
});
