import { assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '../adapters/deno-kv.adapter.ts';
import { createEnvelope, type MessageEnvelope } from '../adapters/_envelope.ts';
import { createKvQueueConnection } from '../adapters/_kv-queue/connection.ts';
import { KvQueueDispatcher } from '../adapters/_kv-queue/dispatcher.ts';
import { requeueKvEnvelopeAtomically } from '../adapters/_kv-queue/write-retry.ts';
import { KvDeadLetterStore } from '../adapters/kv-dead-letter-store.ts';

async function withTempKvPath(run: (path: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'queue-kv-requeue-fence-' });
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

function wrapKvForFenceProbe(
  realKv: Deno.Kv,
  options: Readonly<{
    faultOnCommits: ReadonlySet<number>;
    failVerifyGet?: boolean;
  }>,
) {
  let requeueCommits = 0;
  let pendingVerifyFail = false;
  const markerExpireIns: Array<number | undefined> = [];

  const kv = new Proxy(realKv, {
    get(target, prop, receiver) {
      if (prop === 'atomic') {
        return () => {
          const op = target.atomic();
          let atomicRequeueEnvelope: MessageEnvelope<unknown> | undefined;
          const opProxy = new Proxy(op, {
            get(opTarget, opProp, opReceiver) {
              if (opProp === 'set') {
                return (key: Deno.KvKey, value: unknown, setOpts?: { expireIn?: number }) => {
                  if (key[0] === 'queue:requeue') {
                    markerExpireIns.push(setOpts?.expireIn);
                  }
                  opTarget.set(key, value, setOpts);
                  return opProxy;
                };
              }
              if (opProp === 'enqueue') {
                return (value: unknown, enqueueOpts?: { delay?: number }) => {
                  const envelope = extractEnvelope(value);
                  if (envelope) atomicRequeueEnvelope = envelope;
                  opTarget.enqueue(value, enqueueOpts);
                  return opProxy;
                };
              }
              if (opProp === 'commit') {
                return async () => {
                  if (atomicRequeueEnvelope) {
                    requeueCommits += 1;
                    if (options.faultOnCommits.has(requeueCommits)) {
                      await opTarget.commit();
                      if (options.failVerifyGet) {
                        pendingVerifyFail = true;
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
      if (prop === 'get' && options.failVerifyGet) {
        return (key: Deno.KvKey) => {
          if (key[0] === 'queue:requeue' && pendingVerifyFail) {
            pendingVerifyFail = false;
            return Promise.reject(new Error('temporary read failure during verification'));
          }
          return target.get(key);
        };
      }
      const member = Reflect.get(target, prop, receiver);
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });

  return { kv, markerExpireIns };
}

Deno.test('raw legacy non-envelope payload retains a stable identity and does not duplicate on ambiguous committed nack', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const probe = wrapKvForFenceProbe(rawKv, {
      faultOnCommits: new Set([1]),
      failVerifyGet: true,
    });
    const adapter = DenoKvAdapter.withKv<Readonly<{ legacy: string }>>(probe.kv, 'default');
    const observedDeliveries: number[] = [];
    const observedIds = new Set<string>();
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        observedDeliveries.push(context.deliveryCount);
        observedIds.add(context.messageId);
        if (context.deliveryCount === 1) {
          await context.nack({ requeue: true });
          return;
        }
        await context.ack();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await rawKv.enqueue({ legacy: 'payload' });
      await until(() => observedDeliveries.includes(2));
      await delay(300);
      assertEquals(observedDeliveries, [1, 2]);
      assertEquals(observedIds.size, 1, 'raw legacy payload must retain one stable messageId');
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});

Deno.test('stale already-replaced receipt at routing-hop limit is fenced before routing without unroutable DLQ', async () => {
  await withTempKvPath(async (path) => {
    const setupKv = await Deno.openKv(path);
    const staleSource = {
      ...createEnvelope('stale-work', undefined, 'retired-queue'),
      queueName: 'retired-queue',
      routingHops: 2,
      requeueEpoch: 0,
    };
    const replacement = { ...staleSource, deliveryCount: 1, routingHops: 0 };
    try {
      await requeueKvEnvelopeAtomically(setupKv, staleSource, replacement, 60_000);
    } finally {
      setupKv.close();
    }

    const dispatcher = new KvQueueDispatcher(createKvQueueConnection({ path }), {
      maxHops: 2,
      baseDelayMs: 10,
      maxDelayMs: 20,
      parkDelayMs: 20,
    });
    const reEnqueuedRetired: MessageEnvelope<unknown>[] = [];
    const baseEnqueue = dispatcher.enqueue.bind(dispatcher);
    dispatcher.enqueue = async (envelope, delayMs) => {
      if (envelope.queueName === 'retired-queue') {
        reEnqueuedRetired.push(envelope);
      }
      await baseEnqueue(envelope, delayMs);
    };

    const siblingController = new AbortController();
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
    const kv = await dispatcher.kv();
    const retiredDlq = new KvDeadLetterStore<unknown>({ queueName: 'retired-queue', denoKv: kv });

    try {
      await kv.enqueue(staleSource);
      await dispatcher.enqueue(createEnvelope('ping', undefined, 'sibling'));
      await until(() => siblingSeen.length === 1);
      await delay(200);

      assertEquals(
        await retiredDlq.depth(),
        0,
        'stale already-replaced receipt must be fenced before routing and never dead-letter',
      );
      assertEquals(reEnqueuedRetired.length, 0, 'stale receipt must not be re-enqueued or parked');
      assertEquals(
        await listRequeueMarkers(kv),
        [],
        'fenced marker should clean up once the stale native receipt is acknowledged',
      );
    } finally {
      siblingController.abort();
      await siblingListen;
      await dispatcher.close();
      dispatcher.enqueue = baseEnqueue;
    }
  });
});

Deno.test('requeue fence has no wall-clock TTL, cleans up after native ack, and supports multi-epoch reuse', async () => {
  await withTempKvPath(async (path) => {
    const rawKv = await Deno.openKv(path);
    const probe = wrapKvForFenceProbe(rawKv, {
      faultOnCommits: new Set([1, 3]),
      failVerifyGet: true,
    });
    const adapter = DenoKvAdapter.withKv<string>(probe.kv, 'epoch-reuse');
    const observedDeliveries: number[] = [];
    let step = 0;
    const controller = new AbortController();

    const listening = adapter.listen(
      async (_message, context) => {
        observedDeliveries.push(context.deliveryCount);
        step += 1;
        if (step <= 2) {
          await context.nack({ requeue: true, preserveDeliveryCount: true });
          return;
        }
        if (step === 3) {
          await context.nack({ requeue: true });
          return;
        }
        await context.ack();
      },
      { concurrency: 1, signal: controller.signal },
    );

    try {
      await adapter.enqueue('multi-epoch');
      await until(() => observedDeliveries.includes(2), 10_000);
      await delay(300);

      assertEquals(observedDeliveries, [1, 1, 1, 2]);
      assertEquals(
        probe.markerExpireIns.length >= 3 &&
          probe.markerExpireIns.every((ttl) => ttl === undefined),
        true,
        `requeue markers must not rely on wall-clock expireIn (saw ${
          JSON.stringify(probe.markerExpireIns)
        })`,
      );
      await until(async () => (await listRequeueMarkers(rawKv)).length === 0, 2_000);
      assertEquals(await listRequeueMarkers(rawKv), []);
    } finally {
      controller.abort();
      await listening;
      await adapter.stop();
      rawKv.close();
    }
  });
});
