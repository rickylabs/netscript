import { assertEquals } from '@std/assert';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';

Deno.test('DenoKvAdapter getMany preserves order and missing keys beyond the native ten-key limit', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const keys = Array.from({ length: 25 }, (_, index) => ['batch', index]);
    for (let index = 0; index < keys.length; index += 2) await kv.set(keys[index], index);
    const entries = await kv.getMany<number>(keys);
    assertEquals(
      entries.map((entry) => entry?.value ?? null),
      keys.map((_, index) => index % 2 === 0 ? index : null),
    );
    assertEquals(await kv.getMany([]), []);
  } finally {
    await kv.close();
  }
});
