import { assertEquals } from 'jsr:@std/assert@^1';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import { call } from '@orpc/server';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { adminHandlers } from './admin.ts';

Deno.test('workers cleanup endpoint deletes only expired terminal execution records', async () => {
  using _time = new FakeTime('2026-10-10T00:00:00Z');
  await using kv = new MemoryKvAdapter();
  const executionState = new KvExecutionState({ kv });
  const live = await executionState.create({ jobId: 'job', triggeredBy: 'manual' });
  const completed = await executionState.complete(live.id, { status: 'completed' });
  await kv.set(['workers', 'executions', 'old'], {
    ...completed,
    id: 'old',
    completedAt: '2026-10-01T00:00:00Z',
  });
  await kv.set(['workers', 'executions', 'open'], { ...live, id: 'open' });
  const result = await call(adminHandlers.cleanup, undefined, {
    context: {
      db: undefined,
      workers: {
        executionState,
        jobRegistry: new KvJobRegistry({ kv }),
        taskRegistry: new KvTaskRegistry({ kv }),
        idempotency: new KvWorkerIdempotencyStore({ kv }),
      },
    },
  });
  assertEquals(result.deleted, ['old']);
  assertEquals(result.count, 1);
  assertEquals((await executionState.get('open'))?.status, 'pending');
  assertEquals((await executionState.get(live.id))?.status, 'completed');
});
