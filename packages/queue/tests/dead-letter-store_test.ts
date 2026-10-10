import { assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';
import type { DeadLetterRecord } from '../ports/dead-letter.ts';
import { MemoryDeadLetterStore } from '../testing/mod.ts';
import { QueueConfigurationError } from '../ports/errors.ts';

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

for (const backend of ['memory', 'kv'] as const) {
  Deno.test(`${backend} DLQ keeps the first failure per queue/message and releases identity on reprocess`, async () => {
    const kv = await Deno.openKv(':memory:');
    try {
      const store = backend === 'kv'
        ? new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv })
        : new MemoryDeadLetterStore();
      const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
      const duplicate = { ...first, failedAt: '2026-06-20T00:00:02.000Z', deliveryCount: 4 };
      await store.append(first);
      await store.append(duplicate);
      assertEquals(await store.depth(), 1);
      assertEquals(await store.list(), [first]);

      await assertRejects(() => store.reprocess(() => Promise.reject(new Error('requeue failed'))));
      await store.append(duplicate);
      assertEquals(await store.list(), [first], 'failed reprocessing retains identity');
      assertEquals(await store.reprocess(() => Promise.resolve()), 1);
      assertEquals(await store.depth(), 0);

      await store.append(duplicate);
      assertEquals(await store.list(), [duplicate], 'successful reprocessing releases identity');
    } finally {
      kv.close();
    }
  });
}

Deno.test('KvDeadLetterStore deduplicates concurrent appends from separate store instances', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const stores = Array.from(
      { length: 10 },
      () => new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv }),
    );
    await Promise.all(
      stores.map((store, index) =>
        store.append(createRecord('same-id', `2026-06-20T00:00:0${index}.000Z`))
      ),
    );
    assertEquals(await stores[0].depth(), 1);
    const otherQueue = new KvDeadLetterStore({ queueName: 'tasks', denoKv: kv });
    await otherQueue.append({
      ...createRecord('same-id', '2026-06-20T00:00:01.000Z'),
      queueName: 'tasks',
    });
    assertEquals(await otherQueue.depth(), 1, 'identity is scoped by queue name');
    assertEquals(await stores[0].reprocess(() => Promise.resolve()), 1);
    const identities = [];
    for await (const entry of kv.list({ prefix: ['queue:dlq:identity', 'jobs'] })) {
      identities.push(entry);
    }
    assertEquals(identities, [], 'reprocessing does not retain dedupe markers');
  } finally {
    kv.close();
  }
});

Deno.test('KvDeadLetterStore can inspect and reprocess legacy records without deleting newer identities', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv });
    const legacy = createRecord('same-id', '2026-06-20T00:00:01.000Z');
    const current = createRecord('same-id', '2026-06-20T00:00:02.000Z');
    await kv.set(['queue:dlq', 'jobs', legacy.failedAt, legacy.messageId], legacy);
    await store.append(current);
    assertEquals(await store.list(), [legacy, current]);
    assertEquals(await store.reprocess(() => Promise.resolve(), { limit: 1 }), 1);
    await store.append({ ...current, failedAt: '2026-06-20T00:00:03.000Z' });
    assertEquals(await store.list(), [current]);
  } finally {
    kv.close();
  }
});

Deno.test('KvDeadLetterStore refuses non-atomic storage before persisting or reprocessing', async () => {
  const kv = await Deno.openKv(':memory:');
  const adapter = new DenoKvAdapter(kv);
  Object.defineProperty(adapter, 'atomic', { value: undefined });
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', kv: adapter });
    await assertRejects(
      () => store.append(createRecord('msg-1', '2026-06-20T00:00:01.000Z')),
      QueueConfigurationError,
      'requires atomic compare-and-swap',
    );
    assertEquals(await store.depth(), 0);
    let requeued = false;
    await assertRejects(() =>
      store.reprocess(() => {
        requeued = true;
        return Promise.resolve();
      }), QueueConfigurationError);
    assertEquals(requeued, false);
  } finally {
    await adapter.close();
  }
});
