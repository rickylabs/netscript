import { createKvCachePersister } from '../../src/query-client/kv-cache-persister.ts';
import { assertEquals, MemoryCacheStore } from '../test-helpers.ts';

Deno.test('createKvCachePersister stores, reads, and removes serialized query cache data', async () => {
  const store = new MemoryCacheStore();
  const persister = createKvCachePersister({ store, expireIn: 123 });

  await persister.setItem('orders', '{"items":[]}');
  assertEquals(await persister.getItem('orders'), '{"items":[]}');
  assertEquals(store.lastSetOptions?.expireIn, 123);

  await persister.removeItem('orders');
  assertEquals(await persister.getItem('orders'), null);
});
