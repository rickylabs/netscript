import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { createEnvelope, type MessageEnvelope } from '../adapters/_envelope.ts';
import { createKvQueueConnection } from '../adapters/_kv-queue/connection.ts';
import { KvQueueDispatcher } from '../adapters/_kv-queue/dispatcher.ts';
import { KV_QUEUE_PARKED_PREFIX } from '../adapters/_kv-queue/parked.ts';
import { retryKnownUncommittedWrite } from '../adapters/_kv-queue/write-retry.ts';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-sibling-pause-' });
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

Deno.test('file-backed paused queue parks unadmitted delivery without dead-lettering while a sibling route stays live', async () => {
  await withTempKvPath(async (path) => {
    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      parkDelayMs: 20,
    });
    const observedHops: number[] = [];
    const baseEnqueue = dispatcher.enqueue.bind(dispatcher);
    dispatcher.enqueue = async (envelope, delayMs) => {
      if (envelope.queueName === 'paused') {
        observedHops.push(envelope.routingHops ?? 0);
      }
      await baseEnqueue(envelope, delayMs);
    };

    const siblingController = new AbortController();
    const pausedFirst = new AbortController();
    const firstEntered = Promise.withResolvers<void>();
    const releaseFirst = Promise.withResolvers<void>();
    const firstBatch: number[] = [];
    const siblingSeen: string[] = [];

    const siblingListen = dispatcher.listen(
      'sibling',
      (envelope) => {
        siblingSeen.push(String(envelope.payload));
        return Promise.resolve();
      },
      siblingController.signal,
      1,
    );
    const pausedListen = dispatcher.listen(
      'paused',
      async (envelope) => {
        firstEntered.resolve();
        await releaseFirst.promise;
        firstBatch.push(Number(envelope.payload));
      },
      pausedFirst.signal,
      1,
    );
    const dlq = new KvDeadLetterStore<unknown>({
      queueName: 'paused',
      denoKv: await dispatcher.kv(),
    });

    try {
      await dispatcher.enqueue(createEnvelope(1, undefined, 'paused'));
      await firstEntered.promise;
      await dispatcher.enqueue(createEnvelope(2, undefined, 'paused'));
      await delay(60);

      // Explicitly pause 'paused' while msg 2 is unadmitted and 'sibling' remains registered.
      dispatcher.pauseQueue('paused');
      pausedFirst.abort();
      releaseFirst.resolve();
      await pausedListen;

      // Stay paused well beyond maxHops (2 * 20ms) while sibling processes traffic.
      await dispatcher.enqueue(createEnvelope('ping', undefined, 'sibling'));
      await until(() => siblingSeen.length === 1);
      await delay(160);
      assertEquals(await dlq.depth(), 0, 'paused unadmitted delivery must not dead-letter');
      assertEquals(
        observedHops.every((hop) => hop === 0),
        true,
        `paused cancellation handback must not consume routing hops (saw ${
          observedHops.join(',')
        })`,
      );

      // Resume 'paused' and verify the parked delivery arrives cleanly.
      const pausedSecond = new AbortController();
      const resumed: MessageEnvelope<unknown>[] = [];
      const resumedListen = dispatcher.listen(
        'paused',
        (envelope) => {
          resumed.push(envelope);
          return Promise.resolve();
        },
        pausedSecond.signal,
        1,
      );
      try {
        await until(() => resumed.length === 1);
      } finally {
        pausedSecond.abort();
        await resumedListen;
      }

      assertEquals(resumed[0].deliveryCount, 0);
      assertEquals(resumed[0].routingHops ?? 0, 0);
      assertEquals(
        [firstBatch[0], Number(resumed[0].payload)].sort((a, b) => a - b),
        [1, 2],
      );
      assertEquals(await dlq.depth(), 0);
    } finally {
      releaseFirst.resolve();
      pausedFirst.abort();
      siblingController.abort();
      await Promise.allSettled([pausedListen, siblingListen]);
      await dispatcher.close();
      dispatcher.enqueue = baseEnqueue;
    }
  });
});

Deno.test('fresh enqueue for a permanently stopped queue dead-letters as unroutable while a sibling stays live', async () => {
  await withTempKvPath(async (path) => {
    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      parkDelayMs: 20,
    });
    const observedHops: number[] = [];
    const baseEnqueue = dispatcher.enqueue.bind(dispatcher);
    dispatcher.enqueue = async (envelope, delayMs) => {
      if (envelope.queueName === 'retired' && envelope.payload === 'after-stop') {
        observedHops.push(envelope.routingHops ?? 0);
      }
      await baseEnqueue(envelope, delayMs);
    };

    const siblingController = new AbortController();
    const retiredController = new AbortController();
    const warmed = Promise.withResolvers<void>();

    const siblingListen = dispatcher.listen(
      'sibling',
      () => Promise.resolve(),
      siblingController.signal,
      1,
    );
    const retiredListen = dispatcher.listen(
      'retired',
      () => {
        warmed.resolve();
        return Promise.resolve();
      },
      retiredController.signal,
      1,
    );
    const retiredDlq = new KvDeadLetterStore<unknown>({
      queueName: 'retired',
      denoKv: await dispatcher.kv(),
    });

    try {
      await dispatcher.enqueue(createEnvelope('warm', undefined, 'retired'));
      await warmed.promise;

      // Permanently stop 'retired' while 'sibling' stays live.
      retiredController.abort();
      await retiredListen;

      // A fresh message enqueued after stop must hit bounded unroutable DLQ, not park at hop 0.
      const fresh = createEnvelope('after-stop', undefined, 'retired');
      await dispatcher.enqueue(fresh);
      await until(async () => await retiredDlq.depth() === 1, 2_000);

      const [record] = await retiredDlq.list();
      assertEquals(record.reason, 'unroutable');
      assertEquals(record.messageId, fresh.messageId);
      assertEquals(record.payload, 'after-stop');
      assertEquals(
        observedHops.includes(1) && observedHops.includes(2),
        true,
        `expected bounded routing hops [0, 1, 2], saw [${observedHops.join(', ')}]`,
      );
    } finally {
      retiredController.abort();
      siblingController.abort();
      await Promise.allSettled([retiredListen, siblingListen]);
      await dispatcher.close();
      dispatcher.enqueue = baseEnqueue;
    }
  });
});

Deno.test('explicit pause cleared by stopQueue or dispatcher restart resumes bounded unroutable path', async () => {
  await withTempKvPath(async (path) => {
    const first = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      parkDelayMs: 20,
    });
    const siblingA = new AbortController();
    const siblingAListen = first.listen('sibling', () => Promise.resolve(), siblingA.signal, 1);
    const parkedEnvelope = createEnvelope('parked-then-retired', undefined, 'paused-stop');

    try {
      first.pauseQueue('paused-stop');
      await first.enqueue(parkedEnvelope);
      await delay(80);
      const dlqFirst = new KvDeadLetterStore<unknown>({
        queueName: 'paused-stop',
        denoKv: await first.kv(),
      });
      assertEquals(await dlqFirst.depth(), 0, 'explicitly paused queue must park before stop');

      // Clearing pause with stopQueue or closing/restarting the dispatcher must never leave a
      // persistent parking flag on the stored envelope.
      first.stopQueue('paused-stop');
    } finally {
      siblingA.abort();
      await siblingAListen;
      await first.close();
    }

    const restarted = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      parkDelayMs: 20,
    });
    const siblingB = new AbortController();
    const siblingBListen = restarted.listen('sibling', () => Promise.resolve(), siblingB.signal, 1);
    const dlqAfterRestart = new KvDeadLetterStore<unknown>({
      queueName: 'paused-stop',
      denoKv: await restarted.kv(),
    });
    try {
      await until(async () => await dlqAfterRestart.depth() === 1, 2_000);
      const [record] = await dlqAfterRestart.list();
      assertEquals(record.reason, 'unroutable');
      assertEquals(record.messageId, parkedEnvelope.messageId);
    } finally {
      siblingB.abort();
      await siblingBListen;
      await restarted.close();
    }
  });
});

Deno.test('default-policy paused backlog of 100 messages does not saturate SQLite or drop/duplicate work on resume', async () => {
  const BACKLOG = 100;
  const PAUSE_OBSERVE_MS = 5_000;

  await withTempKvPath(async (path) => {
    const paused = new DenoKvAdapter<number>({ path, queueName: 'paused-backlog' });
    const sibling = new DenoKvAdapter<number>({ path, queueName: 'live-sibling' });
    const stateKv = await Deno.openKv(path);

    let nativeEnqueueCalls = 0;
    const realNativeEnqueue = Deno.Kv.prototype.enqueue;
    Deno.Kv.prototype.enqueue = function (
      this: Deno.Kv,
      ...args: Parameters<typeof realNativeEnqueue>
    ) {
      nativeEnqueueCalls += 1;
      return realNativeEnqueue.apply(this, args);
    } as typeof realNativeEnqueue;

    const seen = new Map<number, number>();
    let pausedController = new AbortController();
    const pausedHandler = (message: number) => {
      seen.set(message, (seen.get(message) ?? 0) + 1);
      return Promise.resolve();
    };
    let pausedListen = paused.listen(pausedHandler, {
      concurrency: 1,
      signal: pausedController.signal,
    });

    const siblingController = new AbortController();
    let siblingSeen = 0;
    const siblingListen = sibling.listen(
      () => {
        siblingSeen += 1;
        return Promise.resolve();
      },
      { concurrency: 1, signal: siblingController.signal },
    );

    try {
      await delay(200);
      pausedController.abort();
      await pausedListen;

      for (let i = 0; i < BACKLOG; i++) {
        await paused.enqueue(i);
      }

      // Allow any immediate in-flight park writes to settle before measuring steady-state pause load.
      await delay(300);
      const nativeEnqueuesAtSteadyStart = nativeEnqueueCalls;
      let stateWrites = 0;
      let stateExhausted = 0;
      let siblingEnqueueFailures = 0;
      const pauseDeadline = performance.now() + PAUSE_OBSERVE_MS;
      while (performance.now() < pauseDeadline) {
        const idx = stateWrites;
        stateWrites += 1;
        try {
          const committed = await retryKnownUncommittedWrite(() =>
            stateKv.atomic().set(['sibling-state', idx], { at: idx }).commit()
          );
          if (!committed.ok) {
            stateExhausted += 1;
          }
        } catch {
          stateExhausted += 1;
        }
        try {
          await sibling.enqueue(idx);
        } catch {
          siblingEnqueueFailures += 1;
        }
        await delay(50);
      }

      const unexpectedParkEnqueues = nativeEnqueueCalls - nativeEnqueuesAtSteadyStart -
        (stateWrites - siblingEnqueueFailures);
      assertEquals(
        unexpectedParkEnqueues,
        0,
        `expected zero periodic parking re-enqueues during steady pause, saw ${unexpectedParkEnqueues}`,
      );
      assertEquals(stateExhausted, 0, 'bounded writes on second connection must not exhaust');
      assertEquals(siblingEnqueueFailures, 0, 'sibling enqueues must not fail during pause');
      assert(
        stateWrites >= 20,
        `expected healthy write throughput during pause, saw ${stateWrites}`,
      );
      await until(() => siblingSeen >= stateWrites, 10_000);
      assertEquals(seen.size, 0, 'paused queue must not deliver while paused');

      // Resume paused queue and verify every parked message is delivered once without duplicates.
      pausedController = new AbortController();
      pausedListen = paused.listen(pausedHandler, {
        concurrency: 1,
        signal: pausedController.signal,
      });
      await until(() => seen.size === BACKLOG, 20_000);
      await delay(300);

      const duplicates = [...seen.values()].filter((count) => count > 1).length;
      assertEquals(seen.size, BACKLOG);
      assertEquals(duplicates, 0, 'resumed paused backlog must deliver each message once');
      const dlq = new KvDeadLetterStore<unknown>({
        queueName: 'paused-backlog',
        denoKv: stateKv,
      });
      assertEquals(await dlq.depth(), 0);
    } finally {
      Deno.Kv.prototype.enqueue = realNativeEnqueue;
      pausedController.abort();
      siblingController.abort();
      await Promise.allSettled([pausedListen, siblingListen]);
      await Promise.allSettled([paused.stop(), sibling.stop()]);
      stateKv.close();
    }
  });
});

Deno.test('parked KV rows left by an unclean process exit recover automatically on startup sweep', async () => {
  await withTempKvPath(async (path) => {
    const seedKv = await Deno.openKv(path);
    try {
      for (let i = 0; i < 5; i++) {
        const env = {
          ...createEnvelope(i, undefined, 'crash-recovered'),
          queueName: 'crash-recovered',
        };
        await seedKv.set(
          [KV_QUEUE_PARKED_PREFIX, 'crash-recovered', env.enqueuedAt, i, env.messageId],
          env,
        );
      }
    } finally {
      seedKv.close();
    }

    const adapter = new DenoKvAdapter<number>({ path, queueName: 'crash-recovered' });
    const controller = new AbortController();
    const received: number[] = [];
    const listening = adapter.listen(
      (message) => {
        received.push(message);
        return Promise.resolve();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await until(() => received.length === 5, 5_000);
      assertEquals(received.slice().sort((a, b) => a - b), [0, 1, 2, 3, 4]);
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
    }
  });
});
