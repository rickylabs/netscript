import { assertEquals, assertRejects } from '@std/assert';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  DenoKvAdapter,
  type KvEntry,
  type KvKey,
} from '@netscript/kv';
import { deadline } from '@std/async';
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

for (const indexed of [true, false]) {
  Deno.test(`KvDeadLetterStore retains ${indexed ? 'indexed' : 'legacy'} row when requeue and restore fail`, async () => {
    const kv = await Deno.openKv(':memory:');
    const requeueError = new Error('requeue unavailable');
    const restoreError = new Error('KV writes unavailable');
    let callbackRan = false;
    class UnavailableAfterRequeueKv extends DenoKvAdapter {
      override atomic(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult> {
        if (callbackRan) return Promise.reject(restoreError);
        return super.atomic(checks, mutations);
      }
    }
    const adapter = new UnavailableAfterRequeueKv(kv);
    try {
      const store = new KvDeadLetterStore({ queueName: 'jobs', kv: adapter });
      const record = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
      if (indexed) {
        await store.append(record);
      } else {
        await kv.set(['queue:dlq', 'jobs', record.failedAt, record.messageId], record);
      }
      const error = await assertRejects(() =>
        store.reprocess(() => {
          callbackRan = true;
          return Promise.reject(requeueError);
        })
      );
      assertEquals(callbackRan, true);
      assertEquals(
        await store.depth(),
        1,
        'a failed restore must never be needed to retain the row',
      );
      assertEquals(await store.list(), [record]);
      assertEquals((await kv.get(['queue:dlq:identity', 'jobs', record.messageId])).value, null);
      if (indexed) {
        assertEquals(error instanceof AggregateError, true);
        if (error instanceof AggregateError) {
          assertEquals(error.errors, [requeueError, restoreError]);
        }
      } else {
        assertEquals(error, requeueError);
      }
      callbackRan = false;
      assertEquals(
        await store.reprocess(() => Promise.resolve()),
        1,
        'the row remains reprocessable',
      );
      assertEquals(await store.depth(), 0);
    } finally {
      await adapter.close();
    }
  });
}

Deno.test('KvDeadLetterStore retains the row when deletion after successful requeue fails', async () => {
  const kv = await Deno.openKv(':memory:');
  let callbackRan = false;
  class UnavailableAfterRequeueKv extends DenoKvAdapter {
    override atomic(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult> {
      if (callbackRan) return Promise.reject(new Error('KV writes unavailable'));
      return super.atomic(checks, mutations);
    }
  }
  const adapter = new UnavailableAfterRequeueKv(kv);
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', kv: adapter });
    const record = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
    await store.append(record);
    await assertRejects(() =>
      store.reprocess(() => {
        callbackRan = true;
        return Promise.resolve();
      })
    );
    assertEquals(await store.list(), [record]);
    callbackRan = false;
    assertEquals(await store.reprocess(() => Promise.resolve()), 1);
    assertEquals(await store.depth(), 0);
  } finally {
    await adapter.close();
  }
});

for (const backend of ['memory', 'kv'] as const) {
  Deno.test(`${backend} DLQ preserves an immediate same-id failure during reprocessing`, async () => {
    const kv = await Deno.openKv(':memory:');
    try {
      const store = backend === 'kv'
        ? new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv })
        : new MemoryDeadLetterStore();
      const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
      const next = { ...first, failedAt: '2026-06-20T00:00:02.000Z', deliveryCount: 4 };
      await store.append(first);
      assertEquals(await store.reprocess(() => store.append(next)), 1);
      assertEquals(await store.list(), [next]);
    } finally {
      kv.close();
    }
  });

  Deno.test(`${backend} DLQ rollback preserves a newer failure when requeue throws`, async () => {
    const kv = await Deno.openKv(':memory:');
    try {
      const store = backend === 'kv'
        ? new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv })
        : new MemoryDeadLetterStore();
      const first = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
      const next = { ...first, failedAt: '2026-06-20T00:00:02.000Z' };
      await store.append(first);
      await assertRejects(
        () =>
          store.reprocess(async () => {
            await store.append(next);
            throw new Error('requeue failed after delivery');
          }),
        Error,
        'requeue failed after delivery',
      );
      assertEquals(await store.list(), backend === 'kv' ? [first, next] : [next]);
    } finally {
      kv.close();
    }
  });

  Deno.test(`${backend} DLQ competing reprocessors preserve the delivery guarantee`, async () => {
    const kv = await Deno.openKv(':memory:');
    try {
      const store = backend === 'kv'
        ? new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv })
        : new MemoryDeadLetterStore();
      const competitor = backend === 'kv'
        ? new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv })
        : store;
      await store.append(createRecord('msg-1', '2026-06-20T00:00:01.000Z'));
      let callbacks = 0;
      assertEquals(
        await store.reprocess(async () => {
          callbacks++;
          assertEquals(
            await competitor.reprocess(() => {
              callbacks++;
              return Promise.resolve();
            }),
            backend === 'kv' ? 1 : 0,
          );
        }),
        backend === 'kv' ? 0 : 1,
      );
      assertEquals(callbacks, backend === 'kv' ? 2 : 1);
      assertEquals(await store.depth(), 0);
    } finally {
      kv.close();
    }
  });

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
      assertEquals(
        await store.list(),
        [first],
        'failed reprocessing restores the record and identity',
      );
      assertEquals(await store.reprocess(() => Promise.resolve()), 1);
      assertEquals(await store.depth(), 0);

      await store.append(duplicate);
      assertEquals(await store.list(), [duplicate], 'successful reprocessing releases identity');
    } finally {
      kv.close();
    }
  });
}

Deno.test('KvDeadLetterStore does not revisit later failures across iterator batches', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv });
    const records = Array.from(
      { length: 101 },
      (_, index) =>
        createRecord(`msg-${index}`, new Date(Date.UTC(2026, 5, 20, 0, 0, index)).toISOString()),
    );
    for (const record of records) await store.append(record);
    let callbacks = 0;
    assertEquals(
      await store.reprocess((record) => {
        callbacks++;
        return store.append({ ...record, failedAt: '2026-06-21T00:00:00.000Z' });
      }),
      records.length,
    );
    assertEquals(callbacks, records.length);
    assertEquals(await store.depth(), records.length);
    assertEquals(
      (await store.list()).every((record) => record.failedAt === '2026-06-21T00:00:00.000Z'),
      true,
    );
  } finally {
    kv.close();
  }
});

Deno.test('KvDeadLetterStore preserves an unrelated identity with bigint key parts', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv });
    const record = createRecord('msg-1', '2026-06-20T00:00:01.000Z');
    const identityKey = ['queue:dlq:identity', 'jobs', record.messageId];
    const unrelatedKey = ['queue:dlq', 'jobs', 1n, new Uint8Array([1, 2])];
    await store.append(record);
    await kv.set(identityKey, unrelatedKey);
    assertEquals(await store.reprocess(() => Promise.resolve()), 1);
    assertEquals((await kv.get(identityKey)).value, unrelatedKey);
    assertEquals(await store.depth(), 0);
  } finally {
    kv.close();
  }
});

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

Deno.test('KvDeadLetterStore skips a stale CAS before invoking the requeue callback', async () => {
  const kv = await Deno.openKv(':memory:');
  const readBarrier = Promise.withResolvers<void>();
  class ConcurrentClaimKv extends DenoKvAdapter {
    private identityReads = 0;

    override async get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
      const entry = await super.get<T>(key);
      if (key[0] === 'queue:dlq:identity') {
        if (++this.identityReads === 2) readBarrier.resolve();
        await readBarrier.promise;
      }
      return entry;
    }
  }
  const adapter = new ConcurrentClaimKv(kv);
  try {
    const stores = Array.from(
      { length: 2 },
      () => new KvDeadLetterStore({ queueName: 'jobs', kv: adapter }),
    );
    await stores[0].append(createRecord('msg-1', '2026-06-20T00:00:01.000Z'));
    let callbacks = 0;
    const results = await deadline(
      Promise.all(stores.map((store) =>
        store.reprocess(() => {
          callbacks++;
          return Promise.resolve();
        })
      )),
      5000,
    );
    assertEquals(results.toSorted(), [0, 1]);
    assertEquals(callbacks, 1);
    assertEquals(await stores[0].depth(), 0);
  } finally {
    readBarrier.resolve();
    await adapter.close();
  }
});

Deno.test('KvDeadLetterStore restores a legacy row after a rejected requeue', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const store = new KvDeadLetterStore({ queueName: 'jobs', denoKv: kv });
    const legacy = createRecord('same-id', '2026-06-20T00:00:01.000Z');
    const current = createRecord('same-id', '2026-06-20T00:00:02.000Z');
    await kv.set(['queue:dlq', 'jobs', legacy.failedAt, legacy.messageId], legacy);
    await store.append(current);
    await assertRejects(() =>
      store.reprocess(() => Promise.reject(new Error('requeue failed')), {
        limit: 1,
      })
    );
    assertEquals(await store.list(), [legacy, current]);
    await store.append({ ...current, failedAt: '2026-06-20T00:00:03.000Z' });
    assertEquals(await store.list(), [legacy, current]);
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
