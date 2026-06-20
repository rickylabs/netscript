import { assertEquals } from 'jsr:@std/assert@^1';

import type { SagaInstanceId } from '@netscript/plugin-sagas-core/runtime';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
} from '../../src/runtime/kv-saga-runtime-stores.ts';

Deno.test('KvSagaIdempotencyStore reserves first key, rejects duplicate, and accepts after ttl', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvSagaIdempotencyStore({ kv, ttlMs: 100 });
    const target = { kind: 'message', id: 'orders.created' };

    assertEquals((await store.reserve(target, 'request-1')).accepted, true);
    assertEquals((await store.reserve(target, 'request-1')).accepted, false);

    await delay(1_100);

    assertEquals((await store.reserve(target, 'request-1')).accepted, true);
  } finally {
    kv.close();
  }
});

Deno.test('KvSagaIdempotencyStore shares reservations across fresh store instances', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const first = new KvSagaIdempotencyStore({ kv });
    const second = new KvSagaIdempotencyStore({ kv });
    const target = { kind: 'message', id: 'orders.created' };

    assertEquals((await first.reserve(target, 'request-1')).accepted, true);
    assertEquals((await second.reserve(target, 'request-1')).accepted, false);
  } finally {
    kv.close();
  }
});

Deno.test('KvSagaAppliedKeyStore records exactly one concurrent applied key', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvSagaAppliedKeyStore({ kv });
    const instanceId = 'orders:ord_123' as SagaInstanceId;

    const outcomes = await Promise.all([
      store.recordApplied(instanceId, 'request-1'),
      store.recordApplied(instanceId, 'request-1'),
    ]);

    assertEquals(outcomes.filter((outcome) => outcome.applied).length, 1);
    assertEquals(outcomes.filter((outcome) => !outcome.applied).length, 1);
  } finally {
    kv.close();
  }
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
