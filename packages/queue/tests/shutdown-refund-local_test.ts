import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { MemoryDeadLetterStore, MemoryQueueAdapter } from '../testing/memory-queue.ts';
import type { MessageContext, MessageQueue } from '../ports/mod.ts';
import { bounded } from './_fixtures/redis-lease-harness.ts';

async function queues(
  kind: string,
  test: (create: () => MessageQueue<string>, dead: MemoryDeadLetterStore<string>) => Promise<void>,
): Promise<void> {
  await using kv = new MemoryKvAdapter();
  await using native = kind === 'Deno KV' ? await Deno.openKv(':memory:') : null;
  const dead = new MemoryDeadLetterStore<string>();
  const memory = new MemoryQueueAdapter<string>({ deadLetterStore: dead });
  const queueName = crypto.randomUUID();
  await test(
    () =>
      native
        ? new DenoKvAdapter<string>({ kv: native, queueName, deadLetterStore: dead })
        : kind === 'memory'
        ? memory
        : new KvPollingAdapter<string>({
          kv,
          queueName,
          deadLetterStore: dead,
          maxRetries: 0,
          pollInterval: 1,
        }),
    dead,
  );
}

function hold(queue: MessageQueue<string>) {
  const entered = Promise.withResolvers<{ message: string; delivery: MessageContext }>();
  const release = Promise.withResolvers<void>();
  const stop = new AbortController();
  const done = queue.listen(async (message, delivery) => {
    entered.resolve({ message, delivery });
    await release.promise;
  }, { signal: stop.signal });
  void done.catch(() => {});
  return {
    claim: () => bounded(entered.promise),
    close: async () => {
      stop.abort();
      release.resolve();
      try {
        await bounded(done);
      } finally {
        await queue.stop();
      }
    },
  };
}

for (const kind of ['memory', 'KV polling', 'Deno KV']) {
  Deno.test(`${kind} duplicate handback and old ack cannot affect the replacement`, () =>
    queues(kind, async (create, dead) => {
      const original = create();
      await original.enqueue('original');
      const holds: ReturnType<typeof hold>[] = [];
      try {
        const first = hold(original);
        holds.push(first);
        const { delivery: old } = await first.claim();
        await Promise.all([
          old.nack({ preserveDeliveryCount: true }),
          old.nack({ preserveDeliveryCount: true }),
        ]);
        await old.ack();
        await first.close();
        const second = hold(create());
        holds.push(second);
        const next = await second.claim();
        assertEquals(next.delivery.messageId, old.messageId);
        assertEquals(next.delivery.deliveryCount, 1);
        await old.nack({ preserveDeliveryCount: true });
        await old.ack();
        await next.delivery.ack();
        await second.close();
        const probe = create();
        await probe.enqueue('sentinel');
        const last = hold(probe);
        holds.push(last);
        const received = await last.claim();
        assertEquals(
          received.message,
          'sentinel',
          'A stale context duplicated the completed message.',
        );
        assertEquals(received.delivery.deliveryCount, 1);
        await received.delivery.ack();
        assertEquals(await dead.depth(), 0);
      } finally {
        for (const item of holds) await item.close();
      }
    }));
  Deno.test(`${kind} automatic success closes retained contexts to late handback`, () =>
    queues(kind, async (create, dead) => {
      const firstQueue = create();
      await firstQueue.enqueue('completed');
      const first = hold(firstQueue);
      const holds = [first];
      try {
        const { delivery: old } = await first.claim();
        await first.close();
        await old.nack({ preserveDeliveryCount: true });
        const probe = create();
        await probe.enqueue('sentinel');
        const last = hold(probe);
        holds.push(last);
        const next = await last.claim();
        assertEquals(next.message, 'sentinel');
        await next.delivery.ack();
        assertEquals(await dead.depth(), 0);
      } finally {
        for (const item of holds) await item.close();
      }
    }));
  Deno.test(`${kind} preservation cannot turn a terminal nack into a retry`, () =>
    queues(kind, async (create, dead) => {
      const queue = create();
      await queue.enqueue('terminal');
      const active = hold(queue);
      try {
        await (await active.claim()).delivery.nack({ requeue: false, preserveDeliveryCount: true });
        assertEquals(await dead.depth(), 1);
      } finally {
        await active.close();
      }
    }));
}
