import { assert, assertEquals, assertRejects } from '@std/assert';
import { dispatchSeedSample, type SeedSamplePorts } from '../../src/runtime/seed-sample.ts';
import type { JobDefinition, JobMessage } from '@netscript/plugin-workers-core/runtime';

const seedId = '9023b4e5-7889-4bb8-a8b9-06c1e237eb9a';

function fixture() {
  const messages: JobMessage[] = [];
  const receipts = new Set<string>();
  const order: string[] = [];
  const ports: SeedSamplePorts = {
    readRequest: () => Promise.resolve({ version: 1, seedId }),
    accepted: (id) => Promise.resolve(receipts.has(id)),
    remember: (id) => {
      order.push('remember');
      receipts.add(id);
      return Promise.resolve();
    },
    job: () => Promise.resolve({ enabled: true, topic: 'samples', sample: true }),
    enqueue: (message) => {
      order.push('enqueue');
      messages.push(message);
      return Promise.resolve();
    },
  };
  return { ports, messages, receipts, order };
}

Deno.test('seed handoff dispatches the registered sample then remembers acceptance across restart', async () => {
  const { ports, messages, order } = fixture();
  await dispatchSeedSample(ports);
  await dispatchSeedSample({ ...ports });
  assertEquals(messages.length, 1);
  assertEquals(order, ['enqueue', 'remember']);
  assertEquals(messages[0].jobId, 'health-check');
  assertEquals(messages[0].topic, 'samples');
  assertEquals(messages[0].idempotencyKey, `scaffold-seed:${seedId}`);
});

Deno.test('seed handoff never runs without successful seeding or a marked enabled sample', async () => {
  for (const job of [null, { enabled: false, sample: true }, { enabled: true, sample: false }]) {
    const { ports, messages, receipts } = fixture();
    await dispatchSeedSample({ ...ports, job: () => Promise.resolve(job) });
    assertEquals(messages, []);
    assertEquals(receipts.size, 0);
  }
  const { ports, messages } = fixture();
  await dispatchSeedSample({ ...ports, readRequest: () => Promise.resolve(undefined) });
  assertEquals(messages, []);
});

Deno.test('enqueue failure leaves the seed pending; replay after receipt failure keeps its idempotency key', async () => {
  const { ports, messages, receipts } = fixture();
  await assertRejects(
    () =>
      dispatchSeedSample({
        ...ports,
        enqueue: () => Promise.reject(new Error('queue unavailable')),
      }),
    Error,
    'queue unavailable',
  );
  assertEquals(receipts.size, 0);
  await assertRejects(
    () =>
      dispatchSeedSample({
        ...ports,
        remember: () => Promise.reject(new Error('receipt unavailable')),
      }),
    Error,
    'receipt unavailable',
  );
  await dispatchSeedSample(ports);
  assertEquals(messages.length, 2);
  assertEquals(messages[0].idempotencyKey, messages[1].idempotencyKey);
});

Deno.test('concurrent startup dispatches retain one consumer identity; malformed intent fails closed', async () => {
  const { ports, messages } = fixture();
  await Promise.all([dispatchSeedSample(ports), dispatchSeedSample(ports)]);
  assertEquals(new Set(messages.map((message) => message.idempotencyKey)).size, 1);
  await assertRejects(() =>
    dispatchSeedSample({
      ...ports,
      readRequest: () => Promise.resolve({ version: 99, seedId }),
    })
  );
});

Deno.test('emitted sample executes once through the real consumer after lost receipt and concurrent dispatch', async () => {
  const { MemoryKvAdapter } = await import('@netscript/kv');
  const { KvWorkerIdempotencyStore } = await import('@netscript/plugin-workers-core/stores');
  const { processWorkerJob } = await import('../../worker/job-dispatcher.ts');
  const { createWorkerPool } = await import('../../worker/job-runner-pool.ts');
  const { jobScaffolder, DEFAULT_JOB_INPUT } = await import(
    '../../src/adapter/resources/job/job.ts'
  );
  const artifact = jobScaffolder.emit(DEFAULT_JOB_INPUT)[0];
  assert(artifact.body.kind === 'text');
  const source = artifact.body.text
    .replace(
      "'@netscript/plugin-workers-core'",
      JSON.stringify(import.meta.resolve('@netscript/plugin-workers-core')),
    )
    .replace("'zod'", JSON.stringify(import.meta.resolve('zod')));
  const { default: handler } = await import(
    `data:application/typescript,${encodeURIComponent(source)}`
  );
  assertEquals(handler.scaffoldSample, true);
  const job: JobDefinition = {
    id: 'health-check',
    enabled: true,
    executionType: 'deno',
    entrypoint: import.meta.url,
    handler,
  };
  const { ports, messages } = fixture();
  await assertRejects(
    () =>
      dispatchSeedSample({ ...ports, remember: () => Promise.reject(new Error('lost receipt')) }),
    Error,
    'lost receipt',
  );
  await Promise.all([dispatchSeedSample(ports), dispatchSeedSample(ports)]);
  assertEquals(messages.length, 3);
  await using kv = new MemoryKvAdapter();
  const workerPool = createWorkerPool();
  await workerPool.initialize();
  let created = 0;
  const progress: number[] = [];
  const completed: string[] = [];
  const context: import('../../worker/worker-options.ts').WorkerDispatchContext = {
    workerId: 'sample-proof',
    concurrency: 1,
    registry: { get: () => Promise.resolve(job) },
    executionState: {
      create: () => Promise.resolve({ id: `run-${++created}` }),
      start: (id) => Promise.resolve({ id }),
      progress: (id, percent) => {
        progress.push(percent);
        return Promise.resolve({ id });
      },
      complete: (id, outcome) => {
        completed.push(outcome.status);
        return Promise.resolve({ id });
      },
    },
    taskRegistry: { get: () => Promise.resolve(undefined) },
    taskExecutor: { execute: () => Promise.reject(new Error('unexpected task')) },
    idempotency: new KvWorkerIdempotencyStore({ kv }),
    workerPool,
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
  };
  try {
    for (const message of messages) await processWorkerJob(context, message);
    assertEquals(created, 1);
    assertEquals(completed, ['completed']);
    assertEquals(progress, [50, 100]);
  } finally {
    await workerPool.shutdown();
  }
});
