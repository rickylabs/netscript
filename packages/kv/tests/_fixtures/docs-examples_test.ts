import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '../../mod.ts';
import { createMemoryKvAdapter } from '../../src/testing/mod.ts';

Deno.test('docs: memory quickstart stores and reads job state', async () => {
  const kv = new MemoryKvAdapter();
  try {
    await kv.set(['jobs', 'export'], { status: 'queued' });
    const job = await kv.get<{ status: string }>(['jobs', 'export']);
    assert(job);
    assertEquals(job.value.status, 'queued');
  } finally {
    await kv.close();
  }
});

Deno.test('docs: testing entrypoint creates a clean in-memory adapter', async () => {
  const kv = createMemoryKvAdapter();
  try {
    await kv.set(['contract', 'example'], 1);
    assertEquals((await kv.get<number>(['contract', 'example']))?.value, 1);
  } finally {
    await kv.close();
  }
});

Deno.test('docs: observability recipe receives a watchPrefix event', async () => {
  const kv = new MemoryKvAdapter();
  try {
    const iterator = kv.watchPrefix<{ status: string }>(['jobs'], {
      skipInitial: true,
    })[Symbol.asyncIterator]();

    const next = iterator.next();
    await kv.set(['jobs', 'one'], { status: 'queued' });
    const event = await next;

    assert(!event.done);
    assertEquals(event.value.type, 'set');
    assertEquals(event.value.key, ['jobs', 'one']);

    await iterator.return?.();
  } finally {
    await kv.close();
  }
});
