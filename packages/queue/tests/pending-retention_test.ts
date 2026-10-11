import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';

Deno.test('pending cancellation CAS preserves a concurrently changed KV delayed key', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const queue = new KvPollingAdapter({ kv, queueName: 'race' });
    await queue.enqueue({ body: 'old' }, { delay: 60_000, retentionId: 'terminal' });
    let cancelled = 0;
    await queue.cancelPending(async (ids) => {
      for await (
        const entry of kv.list<Record<string, unknown>>({ prefix: ['queue:pending', 'race'] })
      ) {
        await kv.set(entry.key, {
          ...entry.value,
          retentionId: 'active',
          payload: { body: 'new' },
        });
      }
      return ids;
    }, () => {
      cancelled++;
    });
    assertEquals(cancelled, 0);
    const entries = await Array.fromAsync(
      kv.list<{ retentionId: string }>({ prefix: ['queue:pending', 'race'] }),
    );
    assertEquals(entries.length, 1);
    assertEquals(entries[0].value.retentionId, 'active');
  } finally {
    await kv.close();
  }
});

Deno.test('pending cancellation advances past an active KV prefix after adapter restart', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const queue = new KvPollingAdapter({ kv, queueName: 'prefix' });
    for (let index = 0; index < 100; index++) {
      await queue.enqueue({ body: 'active' }, {
        priority: 100,
        delay: 60_000,
        retentionId: 'active',
      });
    }
    await queue.enqueue({ body: 'terminal' }, {
      priority: 0,
      delay: 60_000,
      retentionId: 'terminal',
    });
    const resolve = (ids: readonly string[]): Promise<readonly string[]> =>
      Promise.resolve(ids.filter((id) => id === 'terminal'));
    assertEquals(await queue.cancelPending(resolve), true);
    const restarted = new KvPollingAdapter({ kv, queueName: 'prefix' });
    const cancelled: string[] = [];
    assertEquals(await restarted.cancelPending(resolve, (id) => cancelled.push(id)), false);
    assertEquals(cancelled, ['terminal']);
    const entries = await Array.fromAsync(
      kv.list<{ retentionId: string }>({ prefix: ['queue:pending', 'prefix'] }),
    );
    assertEquals(entries.length, 100);
    assert(entries.every((entry) => entry.value.retentionId === 'active'));
  } finally {
    await kv.close();
  }
});

Deno.test('KV polling visibility recovery bounds reads and reaches expired claims behind active ones', async () => {
  const kv = new RecoveryCountingKv(await Deno.openKv(':memory:'));
  const queue = new KvPollingAdapter({
    kv,
    queueName: 'recovery',
    pollInterval: 1,
    visibilityTimeout: 10,
    retryBaseDelay: 60_000,
  });
  const controller = new AbortController();
  let listener: Promise<void> | undefined;
  try {
    for (let index = 0; index < 101; index++) {
      const id = String(index).padStart(3, '0');
      await kv.set(['queue:processing', 'recovery', id], {
        id,
        payload: {},
        queue: 'recovery',
        enqueuedAt: new Date().toISOString(),
        availableAt: new Date().toISOString(),
        attempts: 1,
        maxAttempts: 3,
        priority: 50,
        headers: {},
        retentionId: 'instance',
        visibilityTimeout: new Date(Date.now() + (index === 100 ? -1_000 : 60_000)).toISOString(),
      });
    }
    listener = queue.listen(() => Promise.resolve(), { signal: controller.signal });
    const deadline = Date.now() + 3_000;
    while (await kv.has(['queue:processing', 'recovery', '100']) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assertEquals(await kv.has(['queue:processing', 'recovery', '100']), false);
    assertEquals(
      (await Array.fromAsync(kv.list({ prefix: ['queue:pending', 'recovery'] }))).length,
      1,
    );
    assert(kv.largestRecoveryPage <= 100);
  } finally {
    controller.abort();
    await queue.stop();
    await listener;
    await kv.close();
  }
});

class RecoveryCountingKv extends DenoKvAdapter {
  largestRecoveryPage = 0;
  override async *list<T>(
    options: import('@netscript/kv').KvListOptions,
  ): AsyncIterable<import('@netscript/kv').KvEntry<T>> {
    let read = 0;
    try {
      for await (const entry of super.list<T>(options)) {
        read++;
        yield entry;
      }
    } finally {
      if (options.prefix[0] === 'queue:processing') {
        this.largestRecoveryPage = Math.max(this.largestRecoveryPage, read);
      }
    }
  }
}
