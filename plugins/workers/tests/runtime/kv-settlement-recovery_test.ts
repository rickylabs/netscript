import { assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  DenoKvAdapter,
  type KvKey,
  type KvSetOptions,
} from '@netscript/kv';
import { createQueue, type MessageQueue, QueueProvider } from '@netscript/queue';
import { DenoKvAdapter as QueueDenoKvAdapter } from '@netscript/queue/adapters/deno-kv';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { recoveryContext } from '../../worker/test_utils/redis-worker-context.ts';
import { processWorkerJob } from '../../worker/job-dispatcher.ts';
import { Worker } from '../../worker/worker.ts';
import type { WorkerDispatchContext } from '../../worker/worker-options.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'worker-kv-settlement-' });
  try {
    await run(`${dir}/kv.sqlite`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function bounded<T>(promise: Promise<T>, timeoutMs = 5_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
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

function isAppliedMutation(mutations: AtomicMutation[]): boolean {
  return mutations.some((mutation) =>
    mutation.type === 'set' && mutation.key[0] === 'workers' &&
    mutation.key[1] === 'idempotency' && mutation.key[2] === 'applied'
  );
}

function isCompletedWrite(key: KvKey, value: unknown): boolean {
  return key[0] === 'workers' && key[1] === 'executions' &&
    typeof value === 'object' && value !== null &&
    'status' in value && value.status === 'completed';
}

function createWorkerStores(path: string, storage: DenoKvAdapter, prefix: string) {
  const executionState = new KvExecutionState({ kv: storage, workerId: `${prefix}-worker` });
  const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
  const deadLetters = new KvDeadLetterStore<JobMessage>({
    kv: storage,
    queueName: `${prefix}-dlq`,
  });
  const queue = createQueue<JobMessage>(`${prefix}-jobs`, {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    disableAutoTracing: true,
    connection: { denoKv: { path } },
    deadLetterStore: deadLetters,
  });
  const taskQueue = createQueue<TaskMessage>(`${prefix}-tasks`, {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    disableAutoTracing: true,
    connection: { denoKv: { path } },
  });
  return { executionState, idempotency, deadLetters, queue, taskQueue };
}

async function runSingleQueuedJob(
  queue: MessageQueue<JobMessage>,
  context: WorkerDispatchContext,
  message: JobMessage,
): Promise<void> {
  const settled = Promise.withResolvers<void>();
  const controller = new AbortController();
  const listening = queue.listen(async (incoming, delivery) => {
    await processWorkerJob(context, incoming, delivery);
    settled.resolve();
  }, { concurrency: 1, signal: controller.signal });
  try {
    await queue.enqueue(message);
    await bounded(settled.promise);
    await delay(120);
  } finally {
    controller.abort();
    await bounded(listening);
  }
}

for (const faultTarget of ['markApplied', 'executionComplete'] as const) {
  Deno.test(`file-backed worker recovers known-uncommitted SQLite busy on ${faultTarget} without false DLQ or repeated effect`, async () => {
    await withTempKvPath(async (path) => {
      const stateKvRaw = await Deno.openKv(path);
      try {
        let busyInjected = 0;
        let atomicCallsOnApplied = 0;
        let setCallsOnComplete = 0;
        class BusyOnceSettlementKv extends DenoKvAdapter {
          override atomic(
            checks: AtomicCheck[],
            mutations: AtomicMutation[],
          ): Promise<AtomicResult> {
            if (isAppliedMutation(mutations)) {
              atomicCallsOnApplied += 1;
              if (faultTarget === 'markApplied' && busyInjected === 0) {
                busyInjected += 1;
                return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
              }
            }
            return super.atomic(checks, mutations);
          }

          override set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
            if (isCompletedWrite(key, value)) {
              setCallsOnComplete += 1;
              if (faultTarget === 'executionComplete' && busyInjected === 0) {
                busyInjected += 1;
                return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
              }
            }
            return super.set(key, value, options);
          }
        }

        const storage = new BusyOnceSettlementKv(stateKvRaw);
        const { executionState, idempotency, deadLetters, queue, taskQueue } = createWorkerStores(
          path,
          storage,
          `busy-${faultTarget}`,
        );
        let providerEffects = 0;
        const dispatch = recoveryContext(idempotency, {
          execute: () => {
            providerEffects += 1;
            return Promise.resolve({ success: true, duration: 1, result: { applied: true } });
          },
        });
        const worker = new Worker({
          ...dispatch,
          workerId: 'busy-worker',
          queueName: `busy-${faultTarget}-jobs`,
          concurrency: 1,
          queue,
          taskQueue,
          executionState,
          deadLetters,
        });
        const started = worker.start();
        void started.catch(() => {});
        try {
          await queue.enqueue({
            jobId: 'deliver-webhook',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: `key-${faultTarget}`,
          });
          await until(async () => (await executionState.listByStatus('completed')).length === 1);
          await delay(100);
          assertEquals((await executionState.listByStatus('completed')).length, 1);
          assertEquals((await executionState.listByStatus('failed')).length, 0);
          assertEquals(
            await deadLetters.depth(),
            0,
            'transient busy must not create a dead letter',
          );
          assertEquals(providerEffects, 1, 'external provider effect must execute exactly once');
          assertEquals(busyInjected, 1);
          assertEquals(
            faultTarget === 'markApplied' ? atomicCallsOnApplied : setCallsOnComplete,
            2,
          );
        } finally {
          await bounded(worker.stop());
          await bounded(started);
        }
      } finally {
        stateKvRaw.close();
      }
    });
  });
}

Deno.test('file-backed worker preserves CAS refusal as a conflict without transient retry or effect replay', async () => {
  await withTempKvPath(async (path) => {
    const stateKvRaw = await Deno.openKv(path);
    try {
      let casAttempts = 0;
      class CasRefusingKv extends DenoKvAdapter {
        override atomic(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult> {
          if (isAppliedMutation(mutations)) {
            casAttempts += 1;
            return Promise.resolve({ ok: false });
          }
          return super.atomic(checks, mutations);
        }
      }

      const storage = new CasRefusingKv(stateKvRaw);
      const { executionState, idempotency, deadLetters, queue, taskQueue } = createWorkerStores(
        path,
        storage,
        'cas',
      );
      try {
        let directEffects = 0;
        const directContext = {
          ...recoveryContext(idempotency, {
            execute: () => {
              directEffects += 1;
              return Promise.resolve({ success: true, duration: 1 });
            },
          }),
          executionState,
          deadLetters,
        };
        await assertRejects(
          () =>
            processWorkerJob(directContext, {
              jobId: 'cas-direct',
              topic: 'jobs',
              triggeredBy: 'queue',
              idempotencyKey: 'cas-direct-key',
            }),
          Error,
          'claim lost',
        );
        assertEquals(casAttempts, 1, 'CAS refusal must never retry as transient');
        assertEquals(directEffects, 1);
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 0);
        assertEquals((await executionState.listByStatus('failed')).length, 0);

        casAttempts = 0;
        let queuedEffects = 0;
        const queuedContext = {
          ...recoveryContext(idempotency, {
            execute: () => {
              queuedEffects += 1;
              return Promise.resolve({ success: true, duration: 1 });
            },
          }),
          executionState,
          deadLetters,
        };
        await runSingleQueuedJob(queue, queuedContext, {
          jobId: 'cas-queued',
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: 'cas-queued-key',
        });
        assertEquals(casAttempts, 1, 'CAS refusal must not retry or redeliver');
        assertEquals(queuedEffects, 1, 'CAS refusal must not replay the external effect');
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 0);
        assertEquals((await executionState.listByStatus('failed')).length, 0);
      } finally {
        await queue.stop();
        await taskQueue.stop();
      }
    } finally {
      stateKvRaw.close();
    }
  });
});

for (const actuallyCommitted of [true, false] as const) {
  Deno.test(`file-backed worker handles ambiguous markApplied write (committed=${actuallyCommitted}) without blind replay`, async () => {
    await withTempKvPath(async (path) => {
      const stateKvRaw = await Deno.openKv(path);
      try {
        let appliedWriteAttempts = 0;
        class AmbiguousAppliedKv extends DenoKvAdapter {
          override async atomic(
            checks: AtomicCheck[],
            mutations: AtomicMutation[],
          ): Promise<AtomicResult> {
            if (isAppliedMutation(mutations)) {
              appliedWriteAttempts += 1;
              if (actuallyCommitted) await super.atomic(checks, mutations);
              throw new Error('ambiguous write outcome: I/O interrupted during commit');
            }
            return await super.atomic(checks, mutations);
          }
        }

        const storage = new AmbiguousAppliedKv(stateKvRaw);
        const { executionState, idempotency, deadLetters, queue, taskQueue } = createWorkerStores(
          path,
          storage,
          `ambig-${actuallyCommitted}`,
        );
        try {
          let providerEffects = 0;
          const context = {
            ...recoveryContext(idempotency, {
              execute: () => {
                providerEffects += 1;
                return Promise.resolve({ success: true, duration: 1 });
              },
            }),
            executionState,
            deadLetters,
          };
          await runSingleQueuedJob(queue, context, {
            jobId: 'ambig-job',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: `ambig-key-${actuallyCommitted}`,
          });
          assertEquals(appliedWriteAttempts, 1, 'unknown commit outcome must never blindly retry');
          assertEquals(providerEffects, 1, 'ambiguous write outcome must never replay the effect');
          assertEquals(await deadLetters.depth(), 0, 'must not produce a false dead letter');
          assertEquals(
            (await executionState.listByStatus('completed')).length,
            actuallyCommitted ? 1 : 0,
          );
          assertEquals((await executionState.listByStatus('failed')).length, 0);
        } finally {
          await queue.stop();
          await taskQueue.stop();
        }
      } finally {
        stateKvRaw.close();
      }
    });
  });
}

Deno.test('file-backed worker verifies ambiguous executionState.complete commit without replay or failure overwrite', async () => {
  await withTempKvPath(async (path) => {
    const stateKvRaw = await Deno.openKv(path);
    try {
      let completeWriteAttempts = 0;
      class AmbiguousCompleteKv extends DenoKvAdapter {
        override async set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
          if (isCompletedWrite(key, value)) {
            completeWriteAttempts += 1;
            await super.set(key, value, options);
            throw new Error('ambiguous write outcome: interrupted after commit');
          }
          await super.set(key, value, options);
        }
      }

      const storage = new AmbiguousCompleteKv(stateKvRaw);
      const { executionState, idempotency, deadLetters, queue, taskQueue } = createWorkerStores(
        path,
        storage,
        'ambig-complete',
      );
      try {
        let providerEffects = 0;
        const context = {
          ...recoveryContext(idempotency, {
            execute: () => {
              providerEffects += 1;
              return Promise.resolve({ success: true, duration: 1 });
            },
          }),
          executionState,
          deadLetters,
        };
        await runSingleQueuedJob(queue, context, {
          jobId: 'ambig-complete-job',
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: 'ambig-complete-key',
        });
        assertEquals(completeWriteAttempts, 1, 'verified committed write must not replay');
        assertEquals(providerEffects, 1);
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 1);
        assertEquals((await executionState.listByStatus('failed')).length, 0);
      } finally {
        await queue.stop();
        await taskQueue.stop();
      }
    } finally {
      stateKvRaw.close();
    }
  });
});

Deno.test('file-backed worker executes external effect once when ambiguous queue requeue delivers duplicate at-least-once receipts', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    try {
      let injected = 0;
      const proxiedKv = new Proxy(rawKv, {
        get(target, prop, receiver) {
          if (prop === 'enqueue') {
            return async (value: unknown, options?: { delay?: number }) => {
              const candidate = typeof value === 'object' && value !== null &&
                  '__fedify_payload__' in value
                ? (value as { __fedify_payload__?: unknown }).__fedify_payload__
                : value;
              const isRequeue = typeof candidate === 'object' && candidate !== null &&
                'deliveryCount' in candidate &&
                Number((candidate as { deliveryCount?: unknown }).deliveryCount) > 0;
              if (isRequeue && injected === 0) {
                injected += 1;
                await target.enqueue(value, options);
                throw new Error('ambiguous write outcome: interrupted during requeue');
              }
              return await target.enqueue(value, options);
            };
          }
          const member = Reflect.get(target, prop, receiver);
          return typeof member === 'function' ? member.bind(target) : member;
        },
      });

      const storage = new DenoKvAdapter(rawKv);
      const executionState = new KvExecutionState({ kv: storage, workerId: 'at-least-once-w' });
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const deadLetters = new KvDeadLetterStore<JobMessage>({
        kv: storage,
        queueName: 'at-least-once-dlq',
      });
      const queue = QueueDenoKvAdapter.withKv<JobMessage>(proxiedKv, 'at-least-once-jobs');
      let providerEffects = 0;
      const context = {
        ...recoveryContext(idempotency, {
          execute: () => {
            providerEffects += 1;
            return Promise.resolve({ success: true, duration: 1 });
          },
        }),
        executionState,
        deadLetters,
      };
      const controller = new AbortController();
      let deliveriesSeen = 0;
      const listening = queue.listen(
        async (message, delivery) => {
          deliveriesSeen += 1;
          if (deliveriesSeen === 1) {
            await delivery.nack({ requeue: true });
            return;
          }
          await processWorkerJob(context, message, delivery);
        },
        { concurrency: 1, signal: controller.signal },
      );

      try {
        await queue.enqueue({
          jobId: 'dedup-effect-job',
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: 'at-least-once-k1',
        });
        await until(() => deliveriesSeen >= 3, 10_000);
        await delay(150);
        assertEquals(providerEffects, 1, 'worker idempotency must keep external effect at 1');
        assertEquals(await deadLetters.depth(), 0);
        assertEquals((await executionState.listByStatus('completed')).length, 1);
        assertEquals((await executionState.listByStatus('failed')).length, 0);
      } finally {
        controller.abort();
        await bounded(listening);
        await queue.stop();
      }
    } finally {
      rawKv.close();
    }
  });
});
