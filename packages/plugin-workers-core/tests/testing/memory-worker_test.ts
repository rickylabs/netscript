import { assertEquals } from '@std/assert';
import { createJobFixture, createTestWorkersRuntime, MemoryWorker } from '../../src/testing/mod.ts';

Deno.test('MemoryWorker executes job handlers and records dispatches', async () => {
  const worker = new MemoryWorker();
  const job = createJobFixture({
    handler: () => ({ success: true, data: { ok: true } }),
  });

  const result = await worker.dispatch(job, {
    id: 'execution-1',
    job,
    payload: {},
  });

  assertEquals(result, { success: true, data: { ok: true } });
  assertEquals(worker.dispatches.length, 1);
});

Deno.test('createTestWorkersRuntime wires memory ports', async () => {
  const runtime = createTestWorkersRuntime();
  const job = createJobFixture();

  await runtime.jobRegistry.saveJob(job);
  await runtime.worker.dispatch(job, {
    id: 'execution-1',
    job,
    payload: {},
  });

  assertEquals(await runtime.jobRegistry.findJob(job.id), job);
  assertEquals(runtime.memory.worker.dispatches.length, 1);
});
