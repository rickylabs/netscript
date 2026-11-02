import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  dispatchSeedSample,
  readSeedSampleRequest,
  type SeedSamplePorts,
  watchSeedSample,
} from '../../src/runtime/seed-sample.ts';
import { toFileUrl } from '@std/path';
import type { JobDefinition, JobMessage } from '@netscript/plugin-workers-core/runtime';

const seedId = '9023b4e5-7889-4bb8-a8b9-06c1e237eb9a';

Deno.test('a running worker observes a later atomic seed handoff and stops its watcher on shutdown', async () => {
  const root = await Deno.makeTempDir();
  const marker = toFileUrl(`${root}/.netscript/sample-seed.json`);
  const controller = new AbortController();
  const ceiling = setTimeout(() => controller.abort(), 10_000);
  const ready = Promise.withResolvers<void>();
  const dispatched = Promise.withResolvers<void>();
  const { ports, messages } = fixture();
  const watch = watchSeedSample(marker, {
    ...ports,
    readRequest: async () => {
      const value = await readSeedSampleRequest(marker);
      ready.resolve();
      return value;
    },
    remember: async (id) => {
      await ports.remember(id);
      dispatched.resolve();
    },
  }, controller.signal);
  try {
    await Promise.race([ready.promise, watch]);
    assertEquals(messages, []);
    const candidate = `${root}/.netscript/sample-seed.pending.tmp`;
    await Deno.writeTextFile(candidate, JSON.stringify({ version: 1, seedId }));
    await Deno.link(candidate, `${root}/.netscript/sample-seed.json`);
    const observed = await Promise.race([
      dispatched.promise.then(() => true),
      watch.then(() => false),
    ]);
    assert(observed, 'An already-running worker missed the published seed handoff');
    assertEquals(messages.length, 1);
    assertEquals(messages[0].idempotencyKey, `scaffold-seed:${seedId}`);
  } finally {
    controller.abort();
    clearTimeout(ceiling);
    await watch;
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test({
  name: 'seed publications through a symlinked workspace reach the running watcher',
  ignore: Deno.build.os === 'windows', // Creating symlinks requires an elevated Windows test host.
  async fn() {
    const root = await Deno.makeTempDir();
    await Deno.mkdir(`${root}/actual`);
    await Deno.symlink(`${root}/actual`, `${root}/workspace`);
    const marker = toFileUrl(`${root}/workspace/sample-seed.json`);
    const controller = new AbortController();
    const ceiling = setTimeout(() => controller.abort(), 10_000);
    const ready = Promise.withResolvers<void>();
    const dispatched = Promise.withResolvers<void>();
    const { ports, messages } = fixture();
    const watch = watchSeedSample(marker, {
      ...ports,
      readRequest: async () => {
        const value = await readSeedSampleRequest(marker);
        ready.resolve();
        return value;
      },
      remember: async (id) => {
        await ports.remember(id);
        dispatched.resolve();
      },
    }, controller.signal);
    try {
      await Promise.race([ready.promise, watch]);
      await Deno.writeTextFile(marker, JSON.stringify({ version: 1, seedId }));
      const observed = await Promise.race([
        dispatched.promise.then(() => true),
        watch.then(() => false),
      ]);
      assert(observed, 'Symlinked workspace seed was missed');
      assertEquals(messages.length, 1);
    } finally {
      controller.abort();
      clearTimeout(ceiling);
      await watch;
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test('seed watcher consumes existing intent and rejects malformed startup intent', async () => {
  const root = await Deno.makeTempDir();
  const marker = toFileUrl(`${root}/sample-seed.json`);
  const { ports, messages } = fixture();
  const controller = new AbortController();
  const ceiling = setTimeout(() => controller.abort(), 10_000);
  const accepted = Promise.withResolvers<void>();
  const watch = watchSeedSample(marker, {
    ...ports,
    remember: async (id) => {
      await ports.remember(id);
      accepted.resolve();
    },
  }, controller.signal);
  try {
    await Promise.race([accepted.promise, watch]);
    controller.abort();
    await watch;
    assertEquals(messages.length, 1);
    await Deno.writeTextFile(marker, '{"version":99}');
    await assertRejects(() =>
      watchSeedSample(marker, {
        ...ports,
        readRequest: () => readSeedSampleRequest(marker),
      }, new AbortController().signal)
    );
  } finally {
    controller.abort();
    clearTimeout(ceiling);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a failed late dispatch stays pending and a new publication retries without stopping the observer', async () => {
  const root = await Deno.makeTempDir();
  const marker = toFileUrl(`${root}/sample-seed.json`);
  const controller = new AbortController();
  const ceiling = setTimeout(() => controller.abort(), 10_000);
  const ready = Promise.withResolvers<void>();
  const failed = Promise.withResolvers<void>();
  const delivered = Promise.withResolvers<void>();
  const { ports, messages, receipts } = fixture();
  let rejectEnqueue = true;
  const errors: unknown[] = [];
  const watch = watchSeedSample(
    marker,
    {
      ...ports,
      readRequest: () => readSeedSampleRequest(marker),
      enqueue: async (message) => {
        if (rejectEnqueue) throw new Error('transient queue failure');
        await ports.enqueue(message);
      },
      remember: async (id) => {
        await ports.remember(id);
        delivered.resolve();
      },
    },
    controller.signal,
    ready.resolve,
    (error) => {
      errors.push(error);
      failed.resolve();
    },
  );
  try {
    await Promise.race([ready.promise, watch]);
    const request = JSON.stringify({ version: 1, seedId });
    await Deno.writeTextFile(marker, request);
    assert(await Promise.race([failed.promise.then(() => true), watch.then(() => false)]));
    assertEquals(receipts.size, 0);
    rejectEnqueue = false;
    await Deno.writeTextFile(marker, request);
    assert(await Promise.race([delivered.promise.then(() => true), watch.then(() => false)]));
    assertEquals(messages.length, 1);
    assertEquals(receipts.size, 1);
    assert(errors.length >= 1);
  } finally {
    controller.abort();
    clearTimeout(ceiling);
    await watch;
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('seed watcher rearms after its parent directory is removed', async () => {
  const root = await Deno.makeTempDir();
  const directory = `${root}/.netscript`;
  const marker = toFileUrl(`${directory}/sample-seed.json`);
  const controller = new AbortController();
  const ceiling = setTimeout(() => controller.abort(), 10_000);
  const ready = Promise.withResolvers<void>();
  const delivered = Promise.withResolvers<void>();
  const { ports, messages } = fixture();
  const watch = watchSeedSample(
    marker,
    {
      ...ports,
      readRequest: () => readSeedSampleRequest(marker),
      remember: async (id) => {
        await ports.remember(id);
        delivered.resolve();
      },
    },
    controller.signal,
    ready.resolve,
  );
  using changes = Deno.watchFs(root, { recursive: false });
  const close = () => changes.close();
  controller.signal.addEventListener('abort', close, { once: true });
  try {
    await Promise.race([ready.promise, watch]);
    await Deno.remove(directory, { recursive: true });
    const recreated = (async () => {
      for await (const event of changes) {
        if (event.kind === 'create' && event.paths.includes(directory)) return true;
      }
      return false;
    })();
    assert(await Promise.race([recreated, watch.then(() => false)]));
    await Deno.writeTextFile(marker, JSON.stringify({ version: 1, seedId }));
    assert(await Promise.race([delivered.promise.then(() => true), watch.then(() => false)]));
    assertEquals(messages.length, 1);
  } finally {
    controller.abort();
    controller.signal.removeEventListener('abort', close);
    clearTimeout(ceiling);
    await watch;
    await Deno.remove(root, { recursive: true });
  }
});

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
