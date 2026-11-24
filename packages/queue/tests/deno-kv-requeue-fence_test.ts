import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { createEnvelope, type MessageEnvelope } from '../adapters/_envelope.ts';
import { createKvQueueConnection } from '../adapters/_kv-queue/connection.ts';
import { KvQueueDispatcher } from '../adapters/_kv-queue/dispatcher.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-receipt-safety-' });
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

function extractEnvelope(value: unknown): MessageEnvelope<unknown> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = '__fedify_payload__' in value
    ? (value as { __fedify_payload__?: unknown }).__fedify_payload__
    : value;
  if (typeof candidate === 'object' && candidate !== null && 'deliveryCount' in candidate) {
    return candidate as MessageEnvelope<unknown>;
  }
  return undefined;
}

async function listRequeueMarkers(kv: Deno.Kv): Promise<Deno.KvKey[]> {
  const keys: Deno.KvKey[] = [];
  for await (const entry of kv.list({ prefix: ['queue:requeue'] })) {
    keys.push(entry.key);
  }
  return keys;
}

function wrapKvForEnqueueFault(
  realKv: Deno.Kv,
  predicate: (envelope: MessageEnvelope<unknown>) => boolean,
) {
  let faultsInjected = 0;
  let matchingEnqueueCalls = 0;

  const kv = new Proxy(realKv, {
    get(target, prop, receiver) {
      if (prop === 'enqueue') {
        return async (value: unknown, enqueueOpts?: { delay?: number }) => {
          const envelope = extractEnvelope(value);
          if (envelope && predicate(envelope)) {
            matchingEnqueueCalls += 1;
            if (faultsInjected === 0) {
              faultsInjected += 1;
              await target.enqueue(value, enqueueOpts);
              throw new Error('ambiguous write outcome: interrupted during enqueue');
            }
          }
          return await target.enqueue(value, enqueueOpts);
        };
      }
      const member = Reflect.get(target, prop, receiver);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });

  return {
    kv,
    matchingEnqueueCalls: () => matchingEnqueueCalls,
    faultsInjected: () => faultsInjected,
  };
}

Deno.test('distinct raw legacy messages with identical content are both delivered without silent drop', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const probe = wrapKvForEnqueueFault(rawKv, (envelope) => envelope.deliveryCount > 0);
    const adapter = DenoKvAdapter.withKv<Readonly<{ legacy: string }>>(probe.kv, 'default');
    const acknowledgedIds: string[] = [];
    let firstNacked = false;
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        if (!firstNacked && context.deliveryCount === 1) {
          firstNacked = true;
          await context.nack({ requeue: true });
          return;
        }
        acknowledgedIds.push(context.messageId);
        await context.ack();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await rawKv.enqueue({ legacy: 'identical' });
      await rawKv.enqueue({ legacy: 'identical' });
      await until(() => new Set(acknowledgedIds).size >= 2, 5_000);
      await delay(200);
      assertEquals(
        new Set(acknowledgedIds).size >= 2,
        true,
        `two independent identical raw enqueues must produce distinct deliveries (saw ${
          JSON.stringify(acknowledgedIds)
        })`,
      );
      assertEquals(
        probe.matchingEnqueueCalls(),
        1,
        'ambiguous nack must not blindly replay a second requeue write',
      );
      assertEquals(
        await listRequeueMarkers(rawKv),
        [],
        'no durable per-message requeue markers should exist or orphan in KV',
      );
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});

Deno.test('ambiguous routing re-enqueue never blindly retries and retains messageId across at-least-once recovery', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const probe = wrapKvForEnqueueFault(
      rawKv,
      (envelope) => envelope.queueName === 'delayed-target' && (envelope.routingHops ?? 0) === 1,
    );
    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ kv: probe.kv }), {
      maxHops: 4,
      baseDelayMs: 25,
      maxDelayMs: 50,
      parkDelayMs: 25,
    });
    const siblingController = new AbortController();
    const targetController = new AbortController();
    const deliveredIds = new Set<string>();
    const deliveredPayloads: string[] = [];

    const siblingListen = dispatcher.listen(
      'sibling',
      () => Promise.resolve(),
      siblingController.signal,
      1,
    );
    let targetListen: Promise<void> | undefined;

    try {
      const original = createEnvelope('rerouted-work', undefined, 'delayed-target');
      await dispatcher.enqueue(original);
      await until(() => probe.faultsInjected() === 1);

      // Register target listener after the ambiguous hop-1 write failed.
      targetListen = dispatcher.listen(
        'delayed-target',
        (envelope) => {
          deliveredIds.add(envelope.messageId);
          deliveredPayloads.push(String(envelope.payload));
          return Promise.resolve();
        },
        targetController.signal,
        1,
      );
      await until(() => deliveredPayloads.length >= 1, 5_000);
      await delay(250);

      assertEquals(
        probe.matchingEnqueueCalls(),
        1,
        'ambiguous routing re-enqueue must never blindly retry the hop-1 write',
      );
      assertEquals([...deliveredIds], [original.messageId]);
      assertEquals(deliveredPayloads.every((p) => p === 'rerouted-work'), true);
      assertEquals(await listRequeueMarkers(rawKv), []);
    } finally {
      targetController.abort();
      siblingController.abort();
      await Promise.allSettled([siblingListen, targetListen ?? Promise.resolve()]);
      await dispatcher.close();
      rawKv.close();
    }
  });
});
