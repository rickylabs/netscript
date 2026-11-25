import { assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import {
  type AtomicCheck,
  type AtomicMutation,
  type AtomicResult,
  DenoKvAdapter as KvStoreAdapter,
} from '@netscript/kv';
import { createQueue } from '../factory/create-queue.ts';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';
import { QueueConfigurationError, QueueProvider } from '../ports/mod.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-concurrency-' });
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
    if (Date.now() > deadline) {
      throw new Error('Condition did not hold before the deadline.');
    }
    await delay(10);
  }
}

Deno.test('file-backed Deno KV listener honors concurrency 1 for two numbered messages including drain', async () => {
  await withTempKvPath(async (path) => {
    const queue = createQueue<number>('fixture', {
      provider: QueueProvider.DenoKv,
      autoDiscover: false,
      disableAutoTracing: true,
      connection: { denoKv: { path } },
    });
    const controller = new AbortController();
    const firstEntered = Promise.withResolvers<void>();
    const releaseFirst = Promise.withResolvers<void>();
    const received: number[] = [];
    let active = 0;
    let peak = 0;

    const listening = queue.listen(
      async (message, context) => {
        active += 1;
        peak = Math.max(peak, active);
        try {
          if (received.length === 0) {
            firstEntered.resolve();
            await releaseFirst.promise;
          }
          received.push(message);
          await context.ack();
        } finally {
          active -= 1;
        }
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await queue.enqueue(1);
      await queue.enqueue(2);
      await firstEntered.promise;
      await delay(100);
      assertEquals(active, 1, 'only one handler may be active at concurrency 1');
      assertEquals(peak, 1, 'second message must not overlap the held first handler');
      assertEquals(received.length, 0);

      releaseFirst.resolve();
      await until(() => received.length === 2);
      controller.abort();
      await listening;
    } finally {
      releaseFirst.resolve();
      controller.abort();
      await listening.catch(() => {});
      await queue.stop();
    }

    assertEquals(peak, 1);
    assertEquals(active, 0);
    assertEquals([...received].sort((a, b) => a - b), [1, 2]);
  });
});

Deno.test('file-backed Deno KV listener honors concurrency 1 across cancellation and hands unadmitted work back without charging attempts', async () => {
  await withTempKvPath(async (path) => {
    const queue = createQueue<number>('cancel-handback', {
      provider: QueueProvider.DenoKv,
      autoDiscover: false,
      disableAutoTracing: true,
      connection: { denoKv: { path } },
    });
    const firstController = new AbortController();
    const firstEntered = Promise.withResolvers<void>();
    const releaseFirst = Promise.withResolvers<void>();
    const firstBatch: Array<{ message: number; deliveryCount: number }> = [];
    let active = 0;
    let peak = 0;

    const firstListen = queue.listen(
      async (message, context) => {
        active += 1;
        peak = Math.max(peak, active);
        try {
          firstEntered.resolve();
          await releaseFirst.promise;
          firstBatch.push({ message, deliveryCount: context.deliveryCount });
        } finally {
          active -= 1;
        }
      },
      { concurrency: 1, signal: firstController.signal },
    );

    try {
      await queue.enqueue(1);
      await queue.enqueue(2);
      await firstEntered.promise;
      await delay(80);
      assertEquals(peak, 1);

      // Abort while message 1 is active and message 2 is queued waiting for the slot.
      firstController.abort();
      await delay(50);
      assertEquals(firstBatch.length, 0, 'abort must wait for the admitted delivery to finish');
      releaseFirst.resolve();
      await firstListen;

      assertEquals(firstBatch.length, 1, 'unadmitted queued message must not run after abort');
      assertEquals(peak, 1);

      // Replacement listener receives the unadmitted message cleanly with deliveryCount === 1.
      const secondController = new AbortController();
      const secondBatch: Array<{ message: number; deliveryCount: number }> = [];
      const secondListen = queue.listen(
        (message, context) => {
          secondBatch.push({ message, deliveryCount: context.deliveryCount });
          return Promise.resolve();
        },
        { concurrency: 1, signal: secondController.signal },
      );
      try {
        await until(() => secondBatch.length === 1);
      } finally {
        secondController.abort();
        await secondListen;
      }

      assertEquals(secondBatch.length, 1);
      assertEquals(secondBatch[0].deliveryCount, 1);
      const all = [firstBatch[0].message, secondBatch[0].message].sort((a, b) => a - b);
      assertEquals(all, [1, 2]);
    } finally {
      releaseFirst.resolve();
      firstController.abort();
      await firstListen.catch(() => {});
      await queue.stop();
    }
  });
});

Deno.test('file-backed Deno KV listener honors concurrency 2 and rejects invalid concurrency before opening KV', async () => {
  const invalidQueue = new DenoKvAdapter<number>({ queueName: 'invalid-check', useShared: false });
  for (const concurrency of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2_147_483_648]) {
    await assertRejects(
      () =>
        invalidQueue.listen(() => Promise.resolve(), { concurrency, signal: AbortSignal.abort() }),
      QueueConfigurationError,
      'concurrency',
    );
  }
  await invalidQueue.stop();

  await withTempKvPath(async (path) => {
    const queue = createQueue<number>('concurrency-two', {
      provider: QueueProvider.DenoKv,
      autoDiscover: false,
      disableAutoTracing: true,
      connection: { denoKv: { path } },
    });
    const controller = new AbortController();
    const twoEntered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const received: number[] = [];
    let active = 0;
    let peak = 0;

    const listening = queue.listen(
      async (message) => {
        active += 1;
        peak = Math.max(peak, active);
        try {
          if (active === 2) twoEntered.resolve();
          if (received.length < 2) await release.promise;
          received.push(message);
        } finally {
          active -= 1;
        }
      },
      { concurrency: 2, signal: controller.signal },
    );

    try {
      await queue.enqueue(1);
      await queue.enqueue(2);
      await queue.enqueue(3);
      await twoEntered.promise;
      await delay(80);
      assertEquals(active, 2);
      assertEquals(peak, 2);

      release.resolve();
      await until(() => received.length === 3);
      controller.abort();
      await listening;
    } finally {
      release.resolve();
      controller.abort();
      await listening.catch(() => {});
      await queue.stop();
    }

    assertEquals(peak, 2);
    assertEquals([...received].sort((a, b) => a - b), [1, 2, 3]);
  });
});

Deno.test('KvDeadLetterStore retries transient SQLite busy, preserves CAS refusal, and verifies unknown commit outcome on file-backed KV', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    try {
      let busyAttempts = 0;
      class BusyOnceKv extends KvStoreAdapter {
        override atomic(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult> {
          if (++busyAttempts === 1) {
            return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
          }
          return super.atomic(checks, mutations);
        }
      }
      const busyKv = new BusyOnceKv(rawKv);
      const busyStore = new KvDeadLetterStore<{ id: string }>({
        queueName: 'busy-dlq',
        kv: busyKv,
      });
      await busyStore.append({
        messageId: 'm-busy',
        queueName: 'busy-dlq',
        payload: { id: 'm-busy' },
        headers: {},
        deliveryCount: 1,
        enqueuedAt: '2026-11-24T00:00:00.000Z',
        failedAt: '2026-11-24T00:00:01.000Z',
        reason: 'max_attempts_exceeded',
      });
      assertEquals(busyAttempts, 2);
      assertEquals(await busyStore.depth(), 1);

      let casAttempts = 0;
      class CasRefusalKv extends KvStoreAdapter {
        override atomic(
          _checks: AtomicCheck[],
          _mutations: AtomicMutation[],
        ): Promise<AtomicResult> {
          casAttempts += 1;
          return Promise.resolve({ ok: false });
        }
      }
      const casStore = new KvDeadLetterStore<{ id: string }>({
        queueName: 'cas-dlq',
        kv: new CasRefusalKv(rawKv),
      });
      await casStore.append({
        messageId: 'm-cas',
        queueName: 'cas-dlq',
        payload: { id: 'm-cas' },
        headers: {},
        deliveryCount: 1,
        enqueuedAt: '2026-11-24T00:00:00.000Z',
        failedAt: '2026-11-24T00:00:01.000Z',
        reason: 'max_attempts_exceeded',
      });
      assertEquals(casAttempts, 1, 'CAS refusal must never retry as transient');

      let ambiguousCommittedAttempts = 0;
      class AmbiguousCommittedKv extends KvStoreAdapter {
        override async atomic(
          checks: AtomicCheck[],
          mutations: AtomicMutation[],
        ): Promise<AtomicResult> {
          ambiguousCommittedAttempts += 1;
          await super.atomic(checks, mutations);
          throw new Error('ambiguous commit outcome: interrupted after commit');
        }
      }
      const ambiguousStore = new KvDeadLetterStore<{ id: string }>({
        queueName: 'ambiguous-dlq',
        kv: new AmbiguousCommittedKv(rawKv),
      });
      await ambiguousStore.append({
        messageId: 'm-ambig',
        queueName: 'ambiguous-dlq',
        payload: { id: 'm-ambig' },
        headers: {},
        deliveryCount: 1,
        enqueuedAt: '2026-11-24T00:00:00.000Z',
        failedAt: '2026-11-24T00:00:01.000Z',
        reason: 'max_attempts_exceeded',
      });
      assertEquals(
        ambiguousCommittedAttempts,
        1,
        'verified committed ambiguous write must not replay',
      );
      assertEquals(await ambiguousStore.depth(), 1);
    } finally {
      rawKv.close();
    }
  });
});

Deno.test('file-backed Deno KV concurrency bound holds slot through nack settlement', async () => {
  await withTempKvPath(async (path) => {
    const nackEntered = Promise.withResolvers<void>();
    const releaseNack = Promise.withResolvers<void>();
    const events: string[] = [];
    let active = 0;
    let peak = 0;

    const queue = createQueue<number>('whole-delivery-nack', {
      provider: QueueProvider.DenoKv,
      autoDiscover: false,
      disableAutoTracing: true,
      connection: { denoKv: { path } },
      deadLetterStore: {
        append: async () => {
          events.push('nack:start');
          nackEntered.resolve();
          await releaseNack.promise;
          events.push('nack:done');
        },
        list: () => Promise.resolve([]),
        depth: () => Promise.resolve(0),
        reprocess: () => Promise.resolve(0),
      },
    });
    const controller = new AbortController();
    let seen = 0;
    const listening = queue.listen(
      async (message, context) => {
        seen += 1;
        const order = seen;
        active += 1;
        peak = Math.max(peak, active);
        events.push(`handler:${order}:${message}`);
        try {
          if (order === 1) {
            await context.nack({ requeue: false, reason: 'nack_without_requeue' });
          } else {
            await context.ack();
          }
        } finally {
          active -= 1;
        }
      },
      { concurrency: 1, signal: controller.signal },
    );
    try {
      await queue.enqueue(1);
      await queue.enqueue(2);
      await nackEntered.promise;
      await delay(80);
      assertEquals(peak, 1, 'second delivery must wait while first delivery settles nack');
      assertEquals(events.length, 2);
      assertEquals(events[1], 'nack:start');

      releaseNack.resolve();
      await until(() => events.length === 4);
      controller.abort();
      await listening;
    } finally {
      releaseNack.resolve();
      controller.abort();
      await listening.catch(() => {});
      await queue.stop();
    }

    assertEquals(peak, 1);
    assertEquals(events[1], 'nack:start');
    assertEquals(events[2], 'nack:done');
    assertEquals(events[3].startsWith('handler:2:'), true);
  });
});
