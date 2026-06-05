import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { delay } from '@std/async';
import { MemoryKvAdapter } from '../mod.ts';

Deno.test('MemoryKvAdapter supports CRUD, list, and atomic mutations', async () => {
  const kv = new MemoryKvAdapter();

  try {
    await kv.set(['users', '1'], { name: 'Ada' });
    await kv.set(['users', '2'], { name: 'Linus' });

    const first = await kv.get<{ name: string }>(['users', '1']);
    assert(first);
    assertEquals(first.value.name, 'Ada');

    const listed = [];
    for await (const entry of kv.list<{ name: string }>({ prefix: ['users'] })) {
      listed.push(entry.value.name);
    }

    assertEquals(listed, ['Ada', 'Linus']);

    const counterKey = ['counters', 'jobs'] as const;
    await kv.set(counterKey, 1n);
    const current = await kv.get<bigint>(counterKey);
    const result = await kv.atomic(
      [{ key: counterKey, versionstamp: current?.versionstamp ?? null }],
      [{ type: 'sum', key: counterKey, value: 2n }],
    );

    assert(result.ok);
    assertEquals((await kv.get<bigint>(counterKey))?.value, 3n);
  } finally {
    await kv.close();
  }
});

Deno.test('MemoryKvAdapter supports TTL expiry and watchPrefix notifications', async () => {
  const kv = new MemoryKvAdapter();

  try {
    await kv.set(['ttl', 'session'], 'value', { expireIn: 20 });
    await delay(30);
    assertEquals(await kv.get(['ttl', 'session']), null);

    const controller = new AbortController();
    const iterator = kv.watchPrefix<string>(['events'], {
      signal: controller.signal,
      skipInitial: true,
    })[Symbol.asyncIterator]();

    const firstEventPromise = iterator.next();
    await kv.set(['events', 'job-1'], 'created');
    const firstEvent = await firstEventPromise;
    assert(!firstEvent.done);
    assertEquals(firstEvent.value.key, ['events', 'job-1']);
    assertEquals(firstEvent.value.value, 'created');

    const deleteEventPromise = iterator.next();
    await kv.delete(['events', 'job-1']);
    const deleteEvent = await deleteEventPromise;
    assert(!deleteEvent.done);
    assertEquals(deleteEvent.value.type, 'delete');

    controller.abort();
    await iterator.return?.();
  } finally {
    await kv.close();
  }
});

Deno.test('MemoryKvAdapter watch batches key updates', async () => {
  const kv = new MemoryKvAdapter();

  try {
    const controller = new AbortController();
    const iterator = kv.watch<number>([['watch', 'a']], {
      signal: controller.signal,
    })[Symbol.asyncIterator]();

    const batchPromise = iterator.next();
    await kv.set(['watch', 'a'], 1);
    const batch = await batchPromise;
    assert(!batch.done);
    assertStrictEquals(batch.value.length, 1);
    assertEquals(batch.value[0].value, 1);

    controller.abort();
    await iterator.return?.();
  } finally {
    await kv.close();
  }
});
