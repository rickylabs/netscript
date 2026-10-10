import { assertEquals, assertStrictEquals } from '@std/assert';
import { createNetScriptQueryClient } from '../../src/query-client/mod.ts';

Deno.test('Query invalidation does not match a longer filter ending in undefined', async () => {
  const client = createNetScriptQueryClient();
  try {
    client.setQueryData(['users'], { id: 'one' });
    await client.invalidateQueries({ queryKey: ['users', undefined] });
    assertEquals(client.getQueryState(['users'])?.isInvalidated, false);
    await client.invalidateQueries({ queryKey: ['users'] });
    assertEquals(client.getQueryState(['users'])?.isInvalidated, true);
  } finally {
    client.clear();
  }
});

Deno.test('Removing a replaced Query instance preserves the current SDK cache entry', () => {
  const client = createNetScriptQueryClient();
  try {
    const cache = client.getQueryCache();
    client.setQueryData(['users'], 'old');
    const old = cache.find({ queryKey: ['users'] });
    if (!old) throw new Error('Missing original query');
    cache.remove(old);
    client.setQueryData(['users'], 'new');
    const current = cache.find({ queryKey: ['users'] });
    cache.remove(old);
    assertStrictEquals(cache.find({ queryKey: ['users'] }), current);
    assertEquals(client.getQueryData(['users']), 'new');
  } finally {
    client.clear();
  }
});
