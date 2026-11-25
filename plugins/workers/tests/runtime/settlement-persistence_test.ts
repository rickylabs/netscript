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
} from '../../src/runtime/settlement-persistence.ts';
import { recoveryContext } from '../../worker/test_utils/redis-worker-context.ts';
import { processWorkerJob, processWorkerTask } from '../../worker/job-dispatcher.ts';
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
  assertEquals(
    classifySettlementWriteFailure(
      Object.assign(new Error('database is locked'), { code: 'SQLITE_IOERR_WRITE' }),
    ),
    SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
    'explicit non-busy SQLite code must override lock-message fallback',
  );
  assertEquals(
    classifySettlementWriteFailure(new Error('SQLITE_IOERR_WRITE: database is locked')),
    SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifySettlementWriteFailure(
      new Error('database is locked', {
        cause: Object.assign(new Error('io error'), { code: 'SQLITE_IOERR_FSYNC' }),
      }),
    ),
    SETTLEMENT_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
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

  // Must never start a retry at or after the retry-start deadline, including clock overshoot.
  const tightStarts: number[] = [];
  let tightClock = 0;
  const tight = await settleWriteWithVerification(
    () => {
      tightStarts.push(tightClock);
      return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
    },
    {
      policy: { maxAttempts: 4, maxTotalTimeMs: 10, baseDelayMs: 20, maxDelayMs: 50 },
      now: () => tightClock,
      random: () => 1,
      sleep: (ms) => {
        tightClock += ms;
        return Promise.resolve();
      },
    },
  );
  assertEquals(tight.settled, false);
  assertEquals(tightStarts, [0], 'retry must not start at or after the 10 ms deadline');

  const overshootStarts: number[] = [];
  let overshootClock = 0;
  const overshoot = await settleWriteWithVerification(
    () => {
      overshootStarts.push(overshootClock);
      return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
    },
    {
      policy: { maxAttempts: 4, maxTotalTimeMs: 10, baseDelayMs: 4, maxDelayMs: 50 },
      now: () => overshootClock,
      random: () => 1,
      sleep: () => {
        overshootClock += 12;
        return Promise.resolve();
      },
    },
  );
  assertEquals(overshoot.settled, false);
  assertEquals(overshootStarts, [0], 'post-sleep deadline recheck must stop before retry');

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

Deno.test('idempotency commit verification performs zero mutations when marker is absent or backend lacks lookup', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    try {
      let trackMutations = false;
      let mutationsDuringVerify = 0;
      class MutationTrackingKv extends DenoKvAdapter {
        override async atomic(
          checks: AtomicCheck[],
          mutations: AtomicMutation[],
        ): Promise<AtomicResult> {
          if (trackMutations) mutationsDuringVerify += 1;
          const isApplied = mutations.some((m) =>
            m.type === 'set' && m.key[0] === 'workers' && m.key[1] === 'idempotency' &&
            m.key[2] === 'applied'
          );
          if (isApplied) {
            // Simulate expired active marker + uncommitted ambiguous markApplied error.
            const activeKey = mutations.find((m) => m.type === 'delete')?.key;
            if (activeKey) await super.delete(activeKey);
            trackMutations = true;
            throw new Error('ambiguous write outcome');
          }
          return await super.atomic(checks, mutations);
        }
        override set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void> {
          if (trackMutations) mutationsDuringVerify += 1;
          return super.set(key, value, options);
        }
        override delete(key: KvKey): Promise<void> {
          if (trackMutations) mutationsDuringVerify += 1;
          return super.delete(key);
        }
      }

      const storage = new MutationTrackingKv(rawKv);
      const idempotency = new KvWorkerIdempotencyStore({ kv: storage });
      const executionState = new KvExecutionState({ kv: storage, workerId: 'ro-verify' });
      const context = {
        ...recoveryContext(idempotency, {
          execute: () => Promise.resolve({ success: true, duration: 1 }),
        }),
        executionState,
      };
      await assertRejects(
        () =>
          processWorkerJob(context, {
            jobId: 'ro-job',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: 'ro-expired-key',
          }),
        Error,
        'ambiguous write outcome',
      );
      assertEquals(mutationsDuringVerify, 0, 'verification must never mutate KV storage');

      // Backend without read-only lookup must stay unresolved with zero claim/release calls.
      let claimCalls = 0;
      let releaseCalls = 0;
      const customContext = {
        ...recoveryContext(idempotency, {
          execute: () => Promise.resolve({ success: true, duration: 1 }),
        }),
        executionState,
        idempotency: {
          claim: () => {
            claimCalls += 1;
            return Promise.resolve({
              key: 'custom-key',
              source: 'caller' as const,
              claimed: true,
              alreadyApplied: false,
              token: 'tok-1',
            });
          },
          markApplied: () => Promise.reject(new Error('ambiguous write outcome')),
          release: () => {
            releaseCalls += 1;
            return Promise.resolve();
          },
        },
      };
      await assertRejects(
        () =>
          processWorkerJob(customContext, {
            jobId: 'custom-ro-job',
            topic: 'jobs',
            triggeredBy: 'queue',
            idempotencyKey: 'custom-ro-key',
          }),
        Error,
        'ambiguous write outcome',
      );
      assertEquals(claimCalls, 1, 'verification must not call claim()');
      assertEquals(releaseCalls, 0, 'verification must not call release()');
    } finally {
      rawKv.close();
    }
  });
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
