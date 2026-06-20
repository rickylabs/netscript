import { assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';
import type { DeadLetterRecord } from '../ports/dead-letter.ts';

function createRecord(
  messageId: string,
  failedAt: string,
): DeadLetterRecord<{ id: string }> {
  return {
    messageId,
    queueName: 'jobs',
    payload: { id: messageId },
    headers: { traceparent: '00-test' },
    deliveryCount: 3,
    enqueuedAt: '2026-06-20T00:00:00.000Z',
    failedAt,
    reason: 'max_attempts_exceeded',
    errorCode: 'HANDLER_ERROR',
    errorMessage: 'handler failed',
  };
}

Deno.test('KvDeadLetterStore appends, lists, counts, and reprocesses records', async () => {
  const kv = await Deno.openKv(':memory:');
  const adapter = new DenoKvAdapter(kv);
  try {
    const store = new KvDeadLetterStore<{ id: string }>({
      queueName: 'jobs',
      kv: adapter,
    });
    const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
    const second = createRecord('msg-2', '2026-06-20T00:00:02.000Z');

    await store.append(first);
    await store.append(second);

    assertEquals(await store.depth(), 2);
    assertEquals(await store.list({ limit: 1 }), [first]);
    assertEquals(await store.list(), [first, second]);

    const reprocessed: DeadLetterRecord<{ id: string }>[] = [];
    const count = await store.reprocess((record) => {
      reprocessed.push(record);
      return Promise.resolve();
    });

    assertEquals(count, 2);
    assertEquals(reprocessed, [first, second]);
    assertEquals(await store.depth(), 0);
  } finally {
    await adapter.close();
  }
});

Deno.test('KvDeadLetterStore can wrap an injected raw Deno KV lazily', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvDeadLetterStore<{ id: string }>({
      queueName: 'jobs',
      denoKv: kv,
    });
    const record = createRecord('msg-raw', '2026-06-20T00:00:03.000Z');

    await store.append(record);

    assertEquals(await store.depth(), 1);
    assertEquals(await store.list(), [record]);
  } finally {
    kv.close();
  }
});
