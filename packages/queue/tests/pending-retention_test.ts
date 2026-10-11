import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';

Deno.test('pending cancellation CAS preserves a concurrently changed KV delayed key', async () => {
  const kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  try {
    const queue = new KvPollingAdapter({ kv, queueName: 'race' });
    await queue.enqueue({ body: 'old' }, { delay: 60_000, retentionId: 'terminal' });
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
    });
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
    assertEquals(await restarted.cancelPending(resolve), false);
    const entries = await Array.fromAsync(
      kv.list<{ retentionId: string }>({ prefix: ['queue:pending', 'prefix'] }),
    );
    assertEquals(entries.length, 100);
    assert(entries.every((entry) => entry.value.retentionId === 'active'));
  } finally {
    await kv.close();
  }
});
