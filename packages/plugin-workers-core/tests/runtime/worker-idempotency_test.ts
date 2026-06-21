import { assertEquals, assertStringIncludes } from '@std/assert';
import { resolveWorkerIdempotencyKey } from '../../src/runtime/mod.ts';

Deno.test('resolveWorkerIdempotencyKey prefers caller key over message id and payload hash', async () => {
  const resolved = await resolveWorkerIdempotencyKey({
    concept: 'job',
    targetId: 'send-email',
    idempotencyKey: 'caller-key',
    messageId: 'queue-message',
    payload: { orderId: 123 },
  });

  assertEquals(resolved, {
    key: 'job:send-email:caller-key',
    source: 'caller',
  });
});

Deno.test('resolveWorkerIdempotencyKey uses message id when caller key is absent', async () => {
  const resolved = await resolveWorkerIdempotencyKey({
    concept: 'task',
    targetId: 'resize-image',
    messageId: 'msg-1',
    payload: { imageId: 'img-1' },
  });

  assertEquals(resolved, {
    key: 'task:resize-image:msg-1',
    source: 'message-id',
  });
});

Deno.test('resolveWorkerIdempotencyKey hashes payload deterministically as final fallback', async () => {
  const first = await resolveWorkerIdempotencyKey({
    concept: 'job',
    targetId: 'sync-account',
    payload: { accountId: 'acct_1', version: 3 },
  });
  const second = await resolveWorkerIdempotencyKey({
    concept: 'job',
    targetId: 'sync-account',
    payload: { accountId: 'acct_1', version: 3 },
  });

  assertEquals(first, second);
  assertEquals(first.source, 'payload-hash');
  assertStringIncludes(first.key, 'job:sync-account:sha256:');
  assertEquals(first.key.length, 'job:sync-account:sha256:'.length + 64);
});
