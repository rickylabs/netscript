import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  DenoKvAdapter,
} from '@netscript/kv';
import { createQueue, QueueProvider } from '@netscript/queue';
import { KvDeadLetterStore } from '@netscript/queue/adapters/kv-dead-letter-store';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import {
  classifySettlementWriteFailure,
  DEFAULT_SETTLEMENT_RETRY_POLICY,
  SETTLEMENT_FAILURE_CLASS,
  settleWriteWithVerification,
  verifyIdempotencyApplied,
} from '../../src/runtime/settlement-persistence.ts';
import { recoveryContext } from '../../worker/test_utils/redis-worker-context.ts';
import { processWorkerTask } from '../../worker/job-dispatcher.ts';
import { Worker } from '../../worker/worker.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'worker-kv-task-pause-' });
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

Deno.test('settleWriteWithVerification bounds attempts, total time, abort, and CAS refusals', async () => {
  assertEquals(
    classifySettlementWriteFailure(new Error('SQLITE_BUSY: database is locked')),
    SETTLEMENT_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT,
  );
  assertEquals(
    classifySettlementWriteFailure(new Error('Worker idempotency claim lost')),
    SETTLEMENT_FAILURE_CLASS.CAS_CONFLICT,
  );

  let clock = 0;
  const waits: number[] = [];
  const exhausted = await settleWriteWithVerification(
    () => Promise.reject(new Error('SQLITE_BUSY: database is locked')),
    {
      policy: DEFAULT_SETTLEMENT_RETRY_POLICY,
      now: () => clock,
      random: () => 1,
      sleep: (ms) => {
        waits.push(ms);
        clock += ms;
        return Promise.resolve();
      },
    },
  );
  assertEquals(exhausted.settled, false);
  if (!exhausted.settled) {
    assertEquals(exhausted.failureClass, SETTLEMENT_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT);
    assertEquals(exhausted.attempts, DEFAULT_SETTLEMENT_RETRY_POLICY.maxAttempts);
  }
  assertEquals(waits, [15, 30, 60, 120, 240]);

  const cas = await settleWriteWithVerification(
    () => Promise.reject(new Error('Worker idempotency claim lost')),
  );
  assertEquals(cas.settled, false);
  if (!cas.settled) {
    assertEquals(cas.failureClass, SETTLEMENT_FAILURE_CLASS.CAS_CONFLICT);
    assertEquals(cas.attempts, 1);
  }

  const controller = new AbortController();
  const aborted = await settleWriteWithVerification(
    () => Promise.reject(new Error('SQLITE_BUSY: database is locked')),
    {
      signal: controller.signal,
      sleep: (_ms, signal) => {
        controller.abort(new DOMException('shutdown', 'ShutdownError'));
        return Promise.reject(signal?.reason);
      },
    },
  );
  assertEquals(aborted.settled, false);
  if (!aborted.settled) {
    assertEquals(aborted.failureClass, SETTLEMENT_FAILURE_CLASS.ABORTED);
    assertEquals(aborted.attempts, 1);
  }
});

Deno.test('verifyIdempotencyApplied releases an accidental probe claim on an expired key', async () => {
  const released: Array<{ key: string; token?: string }> = [];
  const verified = await verifyIdempotencyApplied(
    {
      claim: () =>
        Promise.resolve({
          key: 'expired-key',
          source: 'caller',
          claimed: true,
          alreadyApplied: false,
          token: 'probe-token',
        }),
      markApplied: () => Promise.resolve(),
      release: (key, token) => {
        released.push({ key, token });
        return Promise.resolve();
      },
    },
    { concept: 'job', targetId: 'j1', idempotencyKey: 'expired-key' },
  );
  assertEquals(verified, { committed: false });
  assertEquals(released, [{ key: 'expired-key', token: 'probe-token' }]);
});

Deno.test('file-backed Worker honors concurrency 1 across pause, drain, and resume without losing work', async () => {
  await withTempKvPath(async (path) => {
    const stateKvRaw = await Deno.openKv(path);
    try {
      const storage = new DenoKvAdapter(stateKvRaw);
      const executionState = new KvExecutionState({ kv: storage, workerId: 'pause-c1' });
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const deadLetters = new KvDeadLetterStore<JobMessage>({ kv: storage, queueName: 'pause-c1' });
      const queue = createQueue<JobMessage>('pause-c1-jobs', {
        provider: QueueProvider.DenoKv,
        autoDiscover: false,
        disableAutoTracing: true,
        connection: { denoKv: { path } },
        deadLetterStore: deadLetters,
      });
      const taskQueue = createQueue<TaskMessage>('pause-c1-tasks', {
        provider: QueueProvider.DenoKv,
        autoDiscover: false,
        disableAutoTracing: true,
        connection: { denoKv: { path } },
      });
      const firstEntered = Promise.withResolvers<void>();
      const releaseFirst = Promise.withResolvers<void>();
      let active = 0;
      let peak = 0;
      let effects = 0;
      const dispatch = recoveryContext(idempotency, {
        execute: async () => {
          active += 1;
          peak = Math.max(peak, active);
          try {
            if (effects === 0) {
              firstEntered.resolve();
              await releaseFirst.promise;
            }
            effects += 1;
            return { success: true, duration: 1 };
          } finally {
            active -= 1;
          }
        },
      });
      const worker = new Worker({
        ...dispatch,
        workerId: 'pause-c1',
        queueName: 'pause-c1-jobs',
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
          jobId: 'one',
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: 'p1',
        });
        await queue.enqueue({
          jobId: 'two',
          topic: 'jobs',
          triggeredBy: 'queue',
          idempotencyKey: 'p2',
        });
        await firstEntered.promise;
        await delay(80);
        assertEquals(peak, 1);

        worker.pause();
        releaseFirst.resolve();
        await until(async () => (await executionState.listByStatus('completed')).length === 1);
        await delay(100);
        assertEquals(effects, 1, 'paused worker must not admit queued second job');
        assertEquals(peak, 1);

        worker.resume();
        await until(async () => (await executionState.listByStatus('completed')).length === 2);
        assertEquals(effects, 2);
        assertEquals(peak, 1);
        assertEquals(await deadLetters.depth(), 0);
      } finally {
        releaseFirst.resolve();
        await worker.stop();
        await started;
      }
    } finally {
      stateKvRaw.close();
    }
  });
});

Deno.test('file-backed task settlement recovers SQLite busy and verifies ambiguous markApplied without replay', async () => {
  await withTempKvPath(async (path) => {
    const stateKvRaw = await Deno.openKv(path);
    try {
      let mode: 'busy-once' | 'ambiguous-committed' = 'busy-once';
      let appliedAttempts = 0;
      class TaskSettlementKv extends DenoKvAdapter {
        override async atomic(
          checks: AtomicCheck[],
          mutations: AtomicMutation[],
        ): Promise<AtomicResult> {
          const isApplied = mutations.some((mutation) =>
            mutation.type === 'set' && mutation.key[0] === 'workers' &&
            mutation.key[1] === 'idempotency' && mutation.key[2] === 'applied'
          );
          if (isApplied) {
            appliedAttempts += 1;
            if (mode === 'busy-once' && appliedAttempts === 1) {
              throw new Error('SQLITE_BUSY: database is locked');
            }
            if (mode === 'ambiguous-committed') {
              await super.atomic(checks, mutations);
              throw new Error('ambiguous commit outcome');
            }
          }
          return await super.atomic(checks, mutations);
        }
      }

      const storage = new TaskSettlementKv(stateKvRaw);
      const executionState = new KvExecutionState({ kv: storage, workerId: 'task-settle' });
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      let effects = 0;
      const context = {
        ...recoveryContext(idempotency, {
          execute: () => {
            effects += 1;
            return Promise.resolve({ success: true, duration: 1 });
          },
        }),
        executionState,
      };
      await processWorkerTask(context, {
        taskId: 'task-busy',
        topic: 'tasks',
        triggeredBy: 'queue',
        idempotencyKey: 'task-busy-key',
      });
      assertEquals(appliedAttempts, 2);
      assertEquals(effects, 1);
      assertEquals(
        (await executionState.listByStatus('completed', { concept: 'task' })).length,
        1,
      );

      mode = 'ambiguous-committed';
      appliedAttempts = 0;
      await processWorkerTask(context, {
        taskId: 'task-ambig',
        topic: 'tasks',
        triggeredBy: 'queue',
        idempotencyKey: 'task-ambig-key',
      });
      assertEquals(appliedAttempts, 1);
      assertEquals(effects, 2);
      assertEquals(
        (await executionState.listByStatus('completed', { concept: 'task' })).length,
        2,
      );
      assertEquals((await executionState.listByStatus('failed', { concept: 'task' })).length, 0);
    } finally {
      stateKvRaw.close();
    }
  });
});
