import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { KvWorkerIdempotencyStore } from './kv-worker-idempotency-store.ts';

Deno.test('worker concurrent same-messageId execution claims admit one winner on real Deno KV', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const stores = Array.from(
    { length: 8 },
    () => new KvWorkerIdempotencyStore({ kv, activeTtlMs: 60_000, appliedTtlMs: 60_000 }),
  );
  const claims = await Promise.all(
    stores.map((store) =>
      store.claim({ concept: 'task', targetId: 'delayed-task', messageId: 'same-message' })
    ),
  );
  assertEquals(claims.filter((claim) => claim.claimed).length, 1);
  assertEquals(claims.filter((claim) => claim.alreadyApplied).length, 0);
});

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name: 'worker concurrent same-messageId execution claims admit one winner on real Redis',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const namespace = `delayed-claims-${crypto.randomUUID()}`;
    const kvs = Array.from({ length: 8 }, () => new RedisKvAdapter({ url: redisUrl, namespace }));
    const stores = kvs.map((kv) =>
      new KvWorkerIdempotencyStore({ kv, activeTtlMs: 60_000, appliedTtlMs: 60_000 })
    );
    try {
      const claims = await Promise.all(
        stores.map((store) =>
          store.claim({ concept: 'task', targetId: 'delayed-task', messageId: 'same-message' })
        ),
      );
      assertEquals(claims.filter((claim) => claim.claimed).length, 1);
      assertEquals(claims.filter((claim) => claim.alreadyApplied).length, 0);
    } finally {
      for await (const entry of kvs[0].list({ prefix: ['workers', 'idempotency'] })) {
        await kvs[0].delete(entry.key);
      }
      await Promise.all(kvs.map((kv) => kv.close()));
    }
  },
});
