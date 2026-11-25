import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import type { MessageEnvelope } from '../adapters/_envelope.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-nack-ambig-' });
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

function wrapKvForRequeueFault(
  realKv: Deno.Kv,
  mode: 'commit-then-throw' | 'throw-without-commit',
) {
  const enqueuedCounts: number[] = [];
  let requeueFaultsInjected = 0;

  const kv = new Proxy(realKv, {
    get(target, prop, receiver) {
      if (prop === 'enqueue') {
        return async (value: unknown, enqueueOpts?: { delay?: number }) => {
          const envelope = extractEnvelope(value);
          const isRequeue = envelope !== undefined && envelope.deliveryCount > 0;
          if (envelope) enqueuedCounts.push(envelope.deliveryCount);
          if (isRequeue && requeueFaultsInjected === 0) {
            requeueFaultsInjected += 1;
            if (mode === 'commit-then-throw') {
              await target.enqueue(value, enqueueOpts);
            }
            throw new Error('ambiguous write outcome: interrupted during requeue');
          }
          return await target.enqueue(value, enqueueOpts);
        };
      }
      const member = Reflect.get(target, prop, receiver);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });

  return { kv, enqueuedCounts };
}

Deno.test('explicit nack after ambiguous committed enqueue never issues a second counted nack and retains messageId across at-least-once recovery', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const harness = wrapKvForRequeueFault(rawKv, 'commit-then-throw');
    const adapter = DenoKvAdapter.withKv<string>(harness.kv, 'ambig-committed-nack');
    const observedDeliveries: number[] = [];
    const observedIds = new Set<string>();
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        observedDeliveries.push(context.deliveryCount);
        observedIds.add(context.messageId);
        if (observedDeliveries.length === 1) {
          await context.nack({ requeue: true });
          return;
        }
        await context.ack();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await adapter.enqueue('work');
      await until(() => observedDeliveries.includes(2));
      await delay(250);
      assertEquals(
        harness.enqueuedCounts,
        [0, 1],
        'ambiguous committed nack must never replay a second counted requeue',
      );
      assertEquals(observedIds.size, 1, 'enveloped retries must retain one stable messageId');
      assertEquals(observedDeliveries.includes(2), true);
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});

Deno.test('explicit nack after ambiguous uncommitted enqueue preserves original receipt without a second immediate nack', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const harness = wrapKvForRequeueFault(rawKv, 'throw-without-commit');
    const adapter = DenoKvAdapter.withKv<string>(harness.kv, 'ambig-uncommitted-nack');
    const observedDeliveries: number[] = [];
    const observedIds = new Set<string>();
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        observedDeliveries.push(context.deliveryCount);
        observedIds.add(context.messageId);
        if (observedDeliveries.length === 1) {
          await context.nack({ requeue: true });
          return;
        }
        await context.ack();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await adapter.enqueue('work');
      await until(() => observedDeliveries.length === 2, 10_000);
      await delay(150);
      assertEquals(
        harness.enqueuedCounts,
        [0, 1],
        'outer catch must reuse rejected settlement instead of attempting a second requeue',
      );
      assertEquals(observedDeliveries, [1, 1]);
      assertEquals(observedIds.size, 1);
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});
