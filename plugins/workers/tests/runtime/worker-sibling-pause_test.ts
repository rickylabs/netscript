import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter as KvStorageAdapter } from '@netscript/kv';
import { createQueue, QueueProvider } from '@netscript/queue';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import {
  DEFAULT_UNROUTABLE_POLICY,
  type UnroutablePolicy,
} from '../../../../packages/queue/adapters/_kv-queue/dispatcher.ts';
import { recoveryContext } from '../../worker/test_utils/redis-worker-context.ts';
import { Worker } from '../../worker/worker.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'worker-kv-sibling-pause-' });
  try {
    await run(`${dir}/kv.sqlite`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function until(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await condition())) {
    if (Date.now() > deadline) throw new Error('Condition did not hold before the deadline.');
    await delay(10);
  }
}

async function withShortUnroutablePolicy(run: () => Promise<void>): Promise<void> {
  const mutablePolicy = DEFAULT_UNROUTABLE_POLICY as {
    -readonly [K in keyof UnroutablePolicy]: UnroutablePolicy[K];
  };
  const saved: UnroutablePolicy = { ...DEFAULT_UNROUTABLE_POLICY };
  Object.assign(mutablePolicy, {
    maxHops: 2,
    baseDelayMs: 10,
    maxDelayMs: 20,
    parkDelayMs: 20,
  });
  try {
    await run();
  } finally {
    Object.assign(mutablePolicy, saved);
  }
}

Deno.test('production Worker.pause() parks waiting jobs with a live sibling and Worker.stop() restores bounded unroutable DLQ', async () => {
  await withShortUnroutablePolicy(async () => {
    await withTempKvPath(async (path) => {
      const stateKvRaw = await Deno.openKv(path);
      const siblingQueue = createQueue<string>('sibling', {
        provider: QueueProvider.DenoKv,
        autoDiscover: false,
        disableAutoTracing: true,
        connection: { denoKv: { path } },
      });
      const siblingController = new AbortController();
      const siblingSeen: string[] = [];
      const siblingListen = siblingQueue.listen(
        (message) => {
          siblingSeen.push(message);
          return Promise.resolve();
        },
        { concurrency: 1, signal: siblingController.signal },
      );

      try {
        const storage = new KvStorageAdapter(stateKvRaw);
        const executionState = new KvExecutionState({ kv: storage, workerId: 'sibling-pause' });
        const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
        const jobsQueueName = 'worker-sibling-pause-jobs';
        const tasksQueueName = 'worker-sibling-pause-tasks';
        const jobDeadLetters = new KvDeadLetterStore<JobMessage>({
          kv: storage,
          queueName: jobsQueueName,
        });
        const queue = createQueue<JobMessage>(jobsQueueName, {
          provider: QueueProvider.DenoKv,
          autoDiscover: false,
          disableAutoTracing: true,
          connection: { denoKv: { path } },
          deadLetterStore: jobDeadLetters,
        });
        const taskQueue = createQueue<TaskMessage>(tasksQueueName, {
          provider: QueueProvider.DenoKv,
          autoDiscover: false,
          disableAutoTracing: true,
          connection: { denoKv: { path } },
        });
        const producer = createQueue<JobMessage>(jobsQueueName, {
          provider: QueueProvider.DenoKv,
          autoDiscover: false,
          disableAutoTracing: true,
          connection: { denoKv: { path } },
        });

        const firstEntered = Promise.withResolvers<void>();
        const releaseFirst = Promise.withResolvers<void>();
        const executed: string[] = [];
        const dispatch = recoveryContext(idempotency, {
          execute: async (definition) => {
            executed.push(definition.id);
            if (executed.length === 1) {
              firstEntered.resolve();
              await releaseFirst.promise;
            }
            return { success: true, duration: 1 };
          },
        });
        const worker = new Worker({
          ...dispatch,
          workerId: 'sibling-pause-worker',
          queueName: jobsQueueName,
          concurrency: 1,
          queue,
          taskQueue,
          executionState,
          deadLetters: jobDeadLetters,
        });

        const started = worker.start();
        void started.catch(() => {});

        try {
          await producer.enqueue({
            jobId: 'job-1',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: 'sp-1',
          });
          // Wait until job-1 is admitted and held before enqueuing job-2 so same-ms Deno KV
          // queue ordering cannot deliver job-2 first.
          await firstEntered.promise;
          await producer.enqueue({
            jobId: 'job-2',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: 'sp-2',
          });
          await delay(60);

          // Pause production Worker while job-2 is waiting and sibling listener remains live.
          worker.pause();
          releaseFirst.resolve();
          await until(async () => (await executionState.listByStatus('completed')).length === 1);

          // Exercise live sibling and wait well beyond maxHops (2 * 20 ms).
          await siblingQueue.enqueue('ping-while-paused');
          await until(() => siblingSeen.length === 1);
          await delay(220);

          assertEquals(
            await jobDeadLetters.depth(),
            0,
            'waiting job must stay parked while Worker is paused with a live sibling',
          );
          assertEquals(executed, ['job-1-execution']);

          // Resume Worker and confirm parked job completes cleanly.
          worker.resume();
          await until(async () => (await executionState.listByStatus('completed')).length === 2);
          assertEquals(executed.slice().sort(), ['job-1-execution', 'job-2-execution']);
          assertEquals(await jobDeadLetters.depth(), 0);

          // Permanently stop Worker while sibling remains live: fresh work hits unroutable DLQ.
          await worker.stop();
          await started;

          await producer.enqueue({
            jobId: 'job-after-stop',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: 'sp-after-stop',
          });
          await until(async () => await jobDeadLetters.depth() === 1, 2_000);
          const [record] = await jobDeadLetters.list();
          assertEquals(record.reason, 'unroutable');
          assertEquals(record.payload.jobId, 'job-after-stop');
        } finally {
          releaseFirst.resolve();
          await worker.stop();
          await started;
          await producer.stop();
        }
      } finally {
        siblingController.abort();
        await siblingListen;
        await siblingQueue.stop();
        stateKvRaw.close();
      }
    });
  });
});

Deno.test('paused production Worker with 100 parked jobs does not starve 30 live sibling jobs under default policy', async () => {
  const PARKED_JOBS = 100;
  const SIBLING_JOBS = 30;
  const SIBLING_COMPLETION_BUDGET_MS = 35_000;

  await withTempKvPath(async (path) => {
    const stateKvRaw = await Deno.openKv(path);
    const storage = new KvStorageAdapter(stateKvRaw);
    const idempotency = new KvWorkerIdempotencyStore({ kv: storage });

    const settlementFailures: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const line = args.map(String).join(' ');
      if (line.includes('settlement failed')) {
        settlementFailures.push(line.slice(0, 160));
      }
      originalConsoleError(...args);
    };

    const makeWorker = (name: string, executed: string[]) => {
      const executionState = new KvExecutionState({ kv: storage, workerId: name });
      const jobsQueueName = `${name}-jobs`;
      const deadLetters = new KvDeadLetterStore<JobMessage>({
        kv: storage,
        queueName: jobsQueueName,
      });
      const options = {
        provider: QueueProvider.DenoKv,
        autoDiscover: false,
        disableAutoTracing: true,
        connection: { denoKv: { path } },
      } as const;
      const queue = createQueue<JobMessage>(jobsQueueName, {
        ...options,
        deadLetterStore: deadLetters,
      });
      const taskQueue = createQueue<TaskMessage>(`${name}-tasks`, options);
      const producer = createQueue<JobMessage>(jobsQueueName, options);
      const dispatch = recoveryContext(idempotency, {
        execute: (definition) => {
          executed.push(definition.id);
          return Promise.resolve({ success: true, duration: 1 });
        },
      });
      const worker = new Worker({
        ...dispatch,
        workerId: name,
        queueName: jobsQueueName,
        concurrency: 1,
        queue,
        taskQueue,
        executionState,
        deadLetters,
      });
      return { worker, producer, executionState, deadLetters };
    };

    const executedA: string[] = [];
    const executedB: string[] = [];
    const workerA = makeWorker('paused-backlog-a', executedA);
    const workerB = makeWorker('live-sibling-b', executedB);
    const startedA = workerA.worker.start();
    const startedB = workerB.worker.start();
    void startedA.catch(() => {});
    void startedB.catch(() => {});

    try {
      await delay(300);
      workerA.worker.pause();
      await delay(200);

      let producerFailures = 0;
      const enqueueMeasuring = async (
        producer: { enqueue(message: JobMessage): Promise<void> },
        message: JobMessage,
      ): Promise<void> => {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await producer.enqueue(message);
            return;
          } catch {
            producerFailures += 1;
            await delay(100);
          }
        }
        throw new Error(`Producer enqueue exhausted retries for ${message.jobId}`);
      };

      for (let i = 0; i < PARKED_JOBS; i++) {
        await enqueueMeasuring(workerA.producer, {
          jobId: `parked-a-${i}`,
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: `parked-a-${i}`,
        });
      }

      const began = performance.now();
      for (let i = 0; i < SIBLING_JOBS; i++) {
        await enqueueMeasuring(workerB.producer, {
          jobId: `sibling-b-${i}`,
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: `sibling-b-${i}`,
        });
        await delay(250);
      }

      await until(
        async () => (await workerB.executionState.listByStatus('completed')).length >= SIBLING_JOBS,
        Math.max(1_000, SIBLING_COMPLETION_BUDGET_MS - Math.round(performance.now() - began)),
      );
      const elapsedMs = Math.round(performance.now() - began);

      assert(
        elapsedMs <= SIBLING_COMPLETION_BUDGET_MS,
        `expected 30 sibling jobs to complete within ${SIBLING_COMPLETION_BUDGET_MS} ms, took ${elapsedMs} ms`,
      );
      assertEquals(producerFailures, 0, 'paused backlog must not cause producer enqueue failures');
      assertEquals(
        settlementFailures,
        [],
        'paused backlog must not cause post-effect settlement failures on sibling worker',
      );
      assertEquals((await workerB.executionState.listByStatus('completed')).length, SIBLING_JOBS);
      assertEquals(
        (await workerB.executionState.listByStatus('running')).length,
        0,
        'no sibling execution row may be stranded in running state',
      );
      assertEquals((await workerB.executionState.listByStatus('failed')).length, 0);
      assertEquals(await workerB.deadLetters.depth(), 0);
      assertEquals(executedB.length, SIBLING_JOBS);
      assertEquals(new Set(executedB).size, SIBLING_JOBS);
      assertEquals(executedA.length, 0, 'paused worker must not execute parked jobs while paused');
      assertEquals(await workerA.deadLetters.depth(), 0);
    } finally {
      console.error = originalConsoleError;
      await Promise.allSettled([workerA.worker.stop(), workerB.worker.stop()]);
      await Promise.allSettled([
        startedA,
        startedB,
        workerA.producer.stop(),
        workerB.producer.stop(),
      ]);
      stateKvRaw.close();
    }
  });
});
