import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from './kv-worker-idempotency-store.ts';

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

Deno.test('newer broker delivery takes over its stranded marker and fences the former owner', async () => {
  await using kv = new MemoryKvAdapter();
  const store = new KvWorkerIdempotencyStore({ kv });
  const input = {
    concept: 'task' as const,
    targetId: 'recover',
    idempotencyKey: 'same-effect',
    messageId: 'original-message',
    deliveryCount: 1,
  };
  const first = await store.claim(input);
  assertEquals(first.claimed, true);
  const other = await store.claim({ ...input, messageId: 'other-message', deliveryCount: 2 });
  assertEquals(other.claimed, false, 'a different message cannot steal a caller key');
  assertEquals((await store.claim(input)).claimed, false, 'same-generation duplicates wait');
  const replacements = await Promise.all(
    Array.from({ length: 8 }, () => store.claim({ ...input, deliveryCount: 2 })),
  );
  assertEquals(replacements.filter((claim) => claim.claimed).length, 1);
  const replacement = replacements.find((claim) => claim.claimed)!;
  await store.release(first.key, first.token);
  assertEquals((await store.claim({ ...input, deliveryCount: 2 })).claimed, false);
  await assertRejects(
    () => store.markApplied(first.key, undefined, first.token),
    Error,
    'claim lost',
  );
  await store.markApplied(replacement.key, undefined, replacement.token);
  const duplicate = await store.claim({ ...input, deliveryCount: 3 });
  assertEquals(duplicate.claimed, false);
  assertEquals(duplicate.alreadyApplied, true, 'completed markers survive broker redelivery');
});

Deno.test('KvWorkerIdempotencyStore markApplied verifies ambiguous commits read-only without hidden symbols or masking CAS refusal', async () => {
  await using baseKv = new MemoryKvAdapter();
  let mode: 'normal' | 'commit-then-throw' | 'throw-uncommitted' | 'cas-refusal' = 'normal';
  let failVerifyRead = false;
  let mutationCount = 0;

  const store = new KvWorkerIdempotencyStore({
    kv: {
      get: (key) => {
        if (failVerifyRead && key[2] === 'applied') {
          return Promise.reject(new Error('verification read failed'));
        }
        return baseKv.get(key);
      },
      has: (key) => baseKv.has(key),
      set: (key, value, options) => {
        mutationCount += 1;
        return baseKv.set(key, value, options);
      },
      delete: (key) => {
        mutationCount += 1;
        return baseKv.delete(key);
      },
      atomic: async (checks, ops) => {
        mutationCount += 1;
        const isApply = ops.some((op) => op.type === 'set' && op.key[2] === 'applied');
        if (isApply && mode === 'commit-then-throw') {
          await baseKv.atomic(checks, ops);
          throw new Error('ambiguous write outcome');
        }
        if (isApply && mode === 'throw-uncommitted') {
          throw new Error('ambiguous write outcome');
        }
        if (isApply && mode === 'cas-refusal') {
          return { ok: false };
        }
        return await baseKv.atomic(checks, ops);
      },
    },
  });

  // No global Symbol.for cross-package runtime protocol is attached to the store instance.
  assertEquals(
    Reflect.get(store, Symbol.for('netscript.workers.idempotency.isApplied')),
    undefined,
  );

  // 1. Committed-then-throw resolves cleanly via read-only owner-token verification (zero extra writes).
  const claim1 = await store.claim({ concept: 'job', targetId: 'ro-1', idempotencyKey: 'k1' });
  const beforeApply1 = mutationCount;
  mode = 'commit-then-throw';
  await store.markApplied(claim1.key, 10_000, claim1.token);
  assertEquals(mutationCount, beforeApply1 + 1);

  // 2. Throw-without-commit preserves original error with zero extra writes.
  mode = 'normal';
  const claim2 = await store.claim({ concept: 'job', targetId: 'ro-2', idempotencyKey: 'k2' });
  const beforeApply2 = mutationCount;
  mode = 'throw-uncommitted';
  await assertRejects(
    () => store.markApplied(claim2.key, 10_000, claim2.token),
    Error,
    'ambiguous write outcome',
  );
  assertEquals(mutationCount, beforeApply2 + 1);

  // 3. Read failure during verification preserves original write error with zero extra writes.
  mode = 'normal';
  const claim3 = await store.claim({ concept: 'job', targetId: 'ro-3', idempotencyKey: 'k3' });
  const beforeApply3 = mutationCount;
  mode = 'commit-then-throw';
  failVerifyRead = true;
  await assertRejects(
    () => store.markApplied(claim3.key, 10_000, claim3.token),
    Error,
    'ambiguous write outcome',
  );
  assertEquals(mutationCount, beforeApply3 + 1);
  failVerifyRead = false;

  // 4. CAS refusal ({ ok: false }) always throws claim-lost conflict.
  mode = 'normal';
  const claim4 = await store.claim({ concept: 'job', targetId: 'ro-4', idempotencyKey: 'k4' });
  mode = 'cas-refusal';
  await assertRejects(
    () => store.markApplied(claim4.key, 10_000, claim4.token),
    Error,
    'Worker idempotency claim lost',
  );
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
