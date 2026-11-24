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
  options: Readonly<{
    mode: 'commit-then-throw' | 'throw-without-commit';
    failFirstVerifyGet?: boolean;
  }>,
) {
  const enqueuedCounts: number[] = [];
  let requeueFaultsInjected = 0;
  let verifyGetsFailed = 0;

  const kv = new Proxy(realKv, {
    get(target, prop, receiver) {
      if (prop === 'enqueue') {
        return async (value: unknown, enqueueOpts?: { delay?: number }) => {
          const envelope = extractEnvelope(value);
          const isRequeue = envelope !== undefined && envelope.deliveryCount > 0;
          if (envelope) enqueuedCounts.push(envelope.deliveryCount);
          if (isRequeue && requeueFaultsInjected === 0) {
            requeueFaultsInjected += 1;
            if (options.mode === 'commit-then-throw') {
              await target.enqueue(value, enqueueOpts);
            }
            throw new Error('ambiguous write outcome: interrupted during requeue');
          }
          return await target.enqueue(value, enqueueOpts);
        };
      }
      if (prop === 'atomic') {
        return () => {
          const op = target.atomic();
          let atomicRequeueEnvelope: MessageEnvelope<unknown> | undefined;
          const opProxy = new Proxy(op, {
            get(opTarget, opProp, opReceiver) {
              if (opProp === 'enqueue') {
                return (value: unknown, enqueueOpts?: { delay?: number }) => {
                  const envelope = extractEnvelope(value);
                  if (envelope) {
                    atomicRequeueEnvelope = envelope;
                  }
                  opTarget.enqueue(value, enqueueOpts);
                  return opProxy;
                };
              }
              if (opProp === 'commit') {
                return async () => {
                  if (atomicRequeueEnvelope) {
                    enqueuedCounts.push(atomicRequeueEnvelope.deliveryCount);
                    if (requeueFaultsInjected === 0) {
                      requeueFaultsInjected += 1;
                      if (options.mode === 'commit-then-throw') {
                        await opTarget.commit();
                      }
                      throw new Error('ambiguous write outcome: interrupted during requeue');
                    }
                  }
                  return await opTarget.commit();
                };
              }
              const member = Reflect.get(opTarget, opProp, opReceiver);
              if (typeof member === 'function') {
                return (...args: unknown[]) => {
                  const result = member.apply(opTarget, args);
                  return result === opTarget ? opProxy : result;
                };
              }
              return member;
            },
          });
          return opProxy;
        };
      }
      if (prop === 'get' && options.failFirstVerifyGet) {
        return (key: Deno.KvKey) => {
          if (key[0] === 'queue:requeue' && requeueFaultsInjected === 1 && verifyGetsFailed === 0) {
            verifyGetsFailed += 1;
            return Promise.reject(new Error('temporary read failure during verification'));
          }
          return target.get(key);
        };
      }
      const member = Reflect.get(target, prop, receiver);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });

  return {
    kv,
    enqueuedCounts,
    requeueFaultsInjected: () => requeueFaultsInjected,
  };
}

for (const failFirstVerifyGet of [false, true] as const) {
  Deno.test(`explicit nack after ambiguous committed enqueue does not duplicate delivery (verifyReadFail=${failFirstVerifyGet})`, async () => {
    await withTempKvPath(async (path) => {
      const rawKv = await Deno.openKv(path);
      const harness = wrapKvForRequeueFault(rawKv, {
        mode: 'commit-then-throw',
        failFirstVerifyGet,
      });
      const adapter = DenoKvAdapter.withKv<string>(harness.kv, `ambig-nack-${failFirstVerifyGet}`);
      const observedDeliveries: number[] = [];
      const controller = new AbortController();

      const listening = adapter.listen(
        async (_message, context) => {
          observedDeliveries.push(context.deliveryCount);
          if (context.deliveryCount === 1) {
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
          'ambiguous committed nack must not replay a second counted requeue',
        );
        assertEquals(
          observedDeliveries,
          [1, 2],
          'handler must observe [1, 2] without a duplicate delivery',
        );
      } finally {
        controller.abort();
        await listening;
        await adapter.stop();
        rawKv.close();
      }
    });
  });
}

Deno.test('explicit nack after ambiguous uncommitted enqueue preserves original receipt without a second immediate nack', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const harness = wrapKvForRequeueFault(rawKv, { mode: 'throw-without-commit' });
    const adapter = DenoKvAdapter.withKv<string>(harness.kv, 'ambig-uncommitted-nack');
    const observedDeliveries: number[] = [];
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        observedDeliveries.push(context.deliveryCount);
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
      // First attempt's explicit nack fails uncommitted; native redelivery preserves the receipt.
      await until(() => observedDeliveries.length === 2, 10_000);
      await delay(150);
      assertEquals(
        harness.enqueuedCounts,
        [0, 1],
        'outer catch must reuse rejected settlement instead of attempting a second requeue',
      );
      assertEquals(observedDeliveries, [1, 1]);
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});
