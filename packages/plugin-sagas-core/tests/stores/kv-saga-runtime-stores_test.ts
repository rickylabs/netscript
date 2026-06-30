import { assertEquals } from 'jsr:@std/assert@^1';

import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import type { SagaInstanceId } from '@netscript/plugin-sagas-core/runtime';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
} from '../../src/stores/kv-saga-runtime-stores.ts';

for (const backend of ['memory', 'deno-kv'] as const) {
  Deno.test(`KvSagaIdempotencyStore reserves first key, rejects duplicate, and accepts after ttl with ${backend}`, async () => {
    const kv = await createKvStore(backend);
    const store = new KvSagaIdempotencyStore({ kv, ttlMs: 100 });
    const target = { kind: 'message', id: 'orders.created' };

    assertEquals((await store.reserve(target, 'request-1')).accepted, true);
    assertEquals((await store.reserve(target, 'request-1')).accepted, false);

    await delay(1_100);

    assertEquals((await store.reserve(target, 'request-1')).accepted, true);
    await kv.close();
  });
}

Deno.test('KvSagaIdempotencyStore shares reservations across fresh store instances', async () => {
  const kv = new MemoryKvAdapter();
  const first = new KvSagaIdempotencyStore({ kv });
  const second = new KvSagaIdempotencyStore({ kv });
  const target = { kind: 'message', id: 'orders.created' };

  assertEquals((await first.reserve(target, 'request-1')).accepted, true);
  assertEquals((await second.reserve(target, 'request-1')).accepted, false);
  await kv.close();
});

for (const backend of ['memory', 'deno-kv'] as const) {
  Deno.test(`KvSagaAppliedKeyStore records exactly one concurrent applied key with ${backend}`, async () => {
    const kv = await createKvStore(backend);
    const store = new KvSagaAppliedKeyStore({ kv });
    const instanceId = 'orders:ord_123' as SagaInstanceId;

    const outcomes = await Promise.all([
      store.recordApplied(instanceId, 'request-1'),
      store.recordApplied(instanceId, 'request-1'),
    ]);

    assertEquals(outcomes.filter((outcome) => outcome.applied).length, 1);
    assertEquals(outcomes.filter((outcome) => !outcome.applied).length, 1);
    await kv.close();
  });
}

async function createKvStore(backend: 'memory' | 'deno-kv'): Promise<KvStore> {
  if (backend === 'memory') {
    return new MemoryKvAdapter();
  }
  return new DenoKvAdapter(await Deno.openKv(':memory:'));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
