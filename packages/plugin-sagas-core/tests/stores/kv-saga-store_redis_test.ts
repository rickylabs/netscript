import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { RedisKvAdapter } from '@netscript/kv/redis';
import type { SagaInstanceId, SagaStateEnvelope } from '@netscript/plugin-sagas-core/runtime';
import { KvSagaStore } from '../../src/stores/kv-saga-store.ts';

const now = new Date('2026-08-03T06:00:00.000Z');
const instanceId = 'redis-store:workflow-1' as SagaInstanceId;
const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

Deno.test({
  name: 'CI requires the real Redis saga-store service',
  ignore: !Deno.env.get('CI'),
  fn() {
    assert(redisUrl, 'NETSCRIPT_TEST_REDIS_URL is required in CI');
  },
});

Deno.test('KvSagaStore over Redis fails a dead endpoint loudly instead of hanging', async () => {
  const kv = new RedisKvAdapter({
    url: 'redis://127.0.0.1:1',
    options: { connectTimeout: 100 },
  });
  const store = new KvSagaStore({ kv, prefix: ['dead-redis', 'sagas'] });

  try {
    const error = await assertRejects(
      () => withTimeout(store.save(envelope(1, 0)), 5_000),
      Error,
    );
    assertStringIncludes(error.message, 'could not connect');
  } finally {
    await store.close();
  }
});

Deno.test({
  name: 'KvSagaStore over real Redis lists entries and admits one expected-version save',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const kv = new RedisKvAdapter({ url: redisUrl, namespace: `saga-test-${crypto.randomUUID()}` });
    const store = new KvSagaStore({ kv, prefix: ['sagas'] });

    try {
      await withTimeout(store.save(envelope(1, 0)), 5_000);
      const initial = await withTimeout(store.entries(), 5_000);
      assertEquals(initial.length, 1);

      const outcomes = await withTimeout(
        Promise.allSettled(
          Array.from({ length: 16 }, (_, writer) =>
            store.save(envelope(2, writer + 1), {
              expectedVersion: 1,
            })),
        ),
        5_000,
      );
      assertEquals(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1);
      assertEquals(outcomes.filter((outcome) => outcome.status === 'rejected').length, 15);
    } finally {
      await store.close();
    }
  },
});

function envelope(version: number, writer: number): SagaStateEnvelope {
  return Object.freeze({
    metadata: Object.freeze({
      instanceId,
      version,
      status: 'running',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    }),
    state: Object.freeze({ writer }),
  });
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`operation exceeded ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
