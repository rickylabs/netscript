import { delay } from '@std/async';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from './worker-idempotency-store.ts';

Deno.test('KvWorkerIdempotencyStore claims first delivery and rejects duplicate active claim', async () => {
  await using kv = new MemoryKvAdapter();
  const store = new KvWorkerIdempotencyStore({ kv, activeTtlMs: 10_000 });

  const first = await store.claim({
    concept: 'job',
    targetId: 'send-email',
    idempotencyKey: 'evt-1',
  });
  const duplicate = await store.claim({
    concept: 'job',
    targetId: 'send-email',
    idempotencyKey: 'evt-1',
  });

  assertEquals(first.claimed, true);
  assertEquals(first.alreadyApplied, false);
  assertEquals(duplicate.claimed, false);
  assertEquals(duplicate.alreadyApplied, false);
});

Deno.test('KvWorkerIdempotencyStore release allows a failed delivery to retry', async () => {
  await using kv = new MemoryKvAdapter();
  const store = new KvWorkerIdempotencyStore({ kv });
  const first = await store.claim({ concept: 'task', targetId: 'build', messageId: 'msg-1' });

  await store.release(first.key);

  const retry = await store.claim({ concept: 'task', targetId: 'build', messageId: 'msg-1' });
  assertEquals(retry.claimed, true);
  assertEquals(retry.alreadyApplied, false);
});

Deno.test('KvWorkerIdempotencyStore markApplied rejects later completed duplicate', async () => {
  await using kv = new MemoryKvAdapter();
  const store = new KvWorkerIdempotencyStore({ kv });
  const first = await store.claim({ concept: 'job', targetId: 'sync', idempotencyKey: 'evt-2' });

  await store.markApplied(first.key, 10_000);

  const duplicate = await store.claim({
    concept: 'job',
    targetId: 'sync',
    idempotencyKey: 'evt-2',
  });
  assertEquals(duplicate.claimed, false);
  assertEquals(duplicate.alreadyApplied, true);
});

Deno.test('KvWorkerIdempotencyStore active TTL frees stale claims', async () => {
  await using kv = new MemoryKvAdapter();
  const store = new KvWorkerIdempotencyStore({ kv, activeTtlMs: 5 });

  const first = await store.claim({ concept: 'job', targetId: 'ttl', idempotencyKey: 'evt-3' });
  assertEquals(first.claimed, true);

  await delay(20);

  const retry = await store.claim({ concept: 'job', targetId: 'ttl', idempotencyKey: 'evt-3' });
  assertEquals(retry.claimed, true);
});

Deno.test('KvWorkerIdempotencyStore rejects incomplete KV implementations', async () => {
  await assertRejects(
    () =>
      Promise.resolve().then(() =>
        new KvWorkerIdempotencyStore({
          kv: {
            get: () => Promise.resolve(null),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          } as never,
        })
      ),
    TypeError,
    'missing has',
  );
});
