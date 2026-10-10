import { KvJobRegistry } from '../registry/kv-job-registry.ts';
import { assertEquals } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvExecutionState } from './execution-state.ts';

Deno.test('worker retention expires settled execution and preserves live execution beyond window', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const state = new KvExecutionState({ kv });
  await kv.set(['workers', 'jobs', 'short'], {
    retention: { kvRetentionDays: 1, archiveToDb: false },
  });
  const open = await state.create({ jobId: 'short', triggeredBy: 'manual' });
  const done = await state.create({ jobId: 'short', triggeredBy: 'manual' });
  const completed = await state.complete(done.id, { status: 'completed' });
  if (!completed) throw new Error('Expected persisted execution.');
  await new KvJobRegistry({ kv }).saveExecution({ ...completed });
  time.tick(86_400_001);
  assertEquals(await state.get(done.id), null);
  assertEquals((await state.start(open.id))?.status, 'running');
});

Deno.test('worker cleanup deletes only expired terminal records and advances bounded pages', async () => {
  using time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const state = new KvExecutionState({ kv, kvRetentionDays: 1 });
  const old = await state.create({ jobId: 'job', triggeredBy: 'manual' });
  const live = await state.create({ jobId: 'job', triggeredBy: 'manual' });
  const fresh = await state.create({ jobId: 'job', triggeredBy: 'manual' });
  const completed = await state.complete(old.id, { status: 'failed' });
  const recent = await state.complete(fresh.id, { status: 'completed' });
  // Legacy records without TTL must be swept; seed them in deterministic key order.
  await state.delete(old.id);
  await state.delete(live.id);
  await state.delete(fresh.id);
  await kv.set(['workers', 'executions', 'a-old'], {
    ...completed,
    id: 'a-old',
    completedAt: '2026-10-08T00:00:00Z',
  });
  await kv.set(['workers', 'executions', 'b-live'], { ...live, id: 'b-live' });
  await kv.set(['workers', 'executions', 'c-fresh'], { ...recent, id: 'c-fresh' });
  assertEquals(await state.cleanupExpired(1), ['a-old']);
  assertEquals(await state.cleanupExpired(1), []);
  assertEquals(await state.cleanupExpired(1), []);
  assertEquals((await state.get('b-live'))?.status, 'pending');
  assertEquals((await state.get('c-fresh'))?.status, 'completed');
  time.tick(86_400_001);
  await state.cleanupExpired(1); // completes the page cycle
  assertEquals(await state.cleanupExpired(100), ['c-fresh']);
});

Deno.test('worker cleanup preserves an execution changed concurrently after inspection', async () => {
  using _time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const state = new KvExecutionState({ kv });
  const record = await state.create({ jobId: 'job', triggeredBy: 'manual' });
  await kv.set(['workers', 'executions', record.id], {
    ...record,
    status: 'completed',
    completedAt: '2026-10-01T00:00:00Z',
  });
  const atomic = kv.atomic.bind(kv);
  kv.atomic = async (checks, mutations) => {
    await kv.set(['workers', 'executions', record.id], record);
    return atomic(checks, mutations);
  };
  assertEquals(await state.cleanupExpired(), []);
  assertEquals((await state.get(record.id))?.status, 'pending');
});
