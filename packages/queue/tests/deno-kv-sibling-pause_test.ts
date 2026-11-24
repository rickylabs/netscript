import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { createEnvelope, type MessageEnvelope } from '../adapters/_envelope.ts';
import { createKvQueueConnection } from '../adapters/_kv-queue/connection.ts';
import { KvQueueDispatcher } from '../adapters/_kv-queue/dispatcher.ts';
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
      await dispatcher.enqueue(createEnvelope(2, undefined, 'paused'));
      await firstEntered.promise;
      await delay(60);

      // Pause 'paused' while msg 2 is unadmitted and 'sibling' remains registered.
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
