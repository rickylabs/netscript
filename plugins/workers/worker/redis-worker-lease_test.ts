import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import type { MessageContext } from '@netscript/queue';
import {
  bounded,
  leaseBackends,
  LeaseHarness,
} from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { processWorkerJob, processWorkerTask } from './job-dispatcher.ts';

for (const [backend, url] of leaseBackends) {
  for (const concept of ['job', 'task'] as const) {
    Deno.test({
      name:
        `${backend} a replacement ${concept} executes after a process dies with an active marker`,
      ignore: !url,
      async fn() {
        assert(url);
        await using harness = new LeaseHarness(url);
        const dir = await Deno.makeTempDir();
        let child: Deno.ChildProcess | undefined;
        try {
          const path = `${dir}/idempotency.sqlite3`;
          await using kv = new DenoKvAdapter(await Deno.openKv(path));
          const store = new KvWorkerIdempotencyStore({ kv });
          const queue = harness.queue();
          const message = { jobId: 'recover', taskId: 'recover', triggeredBy: 'queue' };
          await queue.enqueue(message);
          child = new Deno.Command(Deno.execPath(), {
            args: [
              'run',
              '--allow-all',
              '--unstable-kv',
              new URL('./test_utils/redis-worker-crash.ts', import.meta.url).href,
              url,
              harness.name,
              path,
              concept,
            ],
            stdin: 'null',
            stdout: 'piped',
            stderr: 'piped',
          }).spawn();
          const reader = child.stdout.pipeThrough(new TextDecoderStream()).getReader();
          try {
            await bounded(
              (async () => {
                let text = '';
                while (!text.includes('CLAIMED')) {
                  const next = await reader.read();
                  assert(!next.done, 'child must persist its active claim before dying');
                  text += next.value;
                }
              })(),
              15_000,
            );
          } finally {
            child.kill('SIGKILL');
            await child.status;
            await reader.cancel();
            await child.stderr.cancel();
          }
          let effects = 0;
          const context = recoveryContext(store, {
            execute: () => {
              effects++;
              return Promise.resolve({ success: true, duration: 1 });
            },
          });
          const deliveries: number[] = [];
          let messageId: string | undefined;
          const completed = Promise.withResolvers<void>();
          const { controller, done } = harness.listen(queue, async (value, delivery) => {
            deliveries.push(delivery.deliveryCount);
            messageId = delivery.messageId;
            if (concept === 'job') await processWorkerJob(context, value as JobMessage, delivery);
            else await processWorkerTask(context, value as TaskMessage, delivery);
            await delivery.ack();
            completed.resolve();
          });
          await bounded(completed.promise);
          controller.abort();
          await bounded(done);
          assertEquals(deliveries, [2]);
          assertEquals(effects, 1, 'reclaimed work must run before it is acknowledged');
          const applied = await store.claim({
            concept,
            targetId: 'recover',
            messageId,
            deliveryCount: 3,
          });
          assertEquals(applied.alreadyApplied, true);
          assertEquals((await queue.getHealth()).processing, 0);
        } finally {
          if (child) {
            try {
              child.kill('SIGKILL');
            } catch { /* Already killed. */ }
            await child.status;
          }
          await Deno.remove(dir, { recursive: true });
        }
      },
    });
  }

  Deno.test({
    name: `${backend} a healthy task subprocess outlives the default lease without being reclaimed`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
      const context = recoveryContext(
        new KvWorkerIdempotencyStore({ kv }),
        createDefaultTaskExecutor(),
      );
      const queue = harness.queue();
      const completed = Promise.withResolvers<void>();
      let effects = 0;
      let renewals = 0;
      const { controller, done } = harness.listen(queue, async (message, delivery) => {
        effects++;
        const observed = {
          ...delivery,
          extendVisibility: (ms?: number) => {
            renewals++;
            return delivery.extendVisibility!(ms);
          },
        };
        await processWorkerTask(context, message as TaskMessage, observed);
        await delivery.ack();
        completed.resolve();
      });
      await queue.enqueue({
        taskId: 'long',
        topic: 'tasks',
        triggeredBy: 'queue',
        payload: { duration: 31_500 },
      });
      await bounded(completed.promise, 50_000);
      controller.abort();
      await bounded(done);
      assertEquals(effects, 1);
      assert(renewals >= 2, 'initial extension and periodic renewal both reach the real backend');
      assertEquals((await queue.getMetrics()).reclaimed, 0);
      assertEquals((await queue.getHealth()).processing, 0);
    },
  });
}

Deno.test('worker shutdown cancels its real subprocess and cannot mark effects applied', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = new KvWorkerIdempotencyStore({ kv });
  const shutdown = new AbortController();
  const executor = createDefaultTaskExecutor();
  const started = Promise.withResolvers<void>();
  const context = recoveryContext(store, {
    execute: (task, options) => {
      started.resolve();
      return executor.execute(task, options);
    },
  }, shutdown.signal);
  let requeued = 0;
  const delivery: MessageContext = {
    messageId: 'cancel-task',
    deliveryCount: 1,
    enqueuedAt: new Date(),
    headers: {},
    ack: () => Promise.resolve(),
    nack: (options) => {
      assertEquals(options?.requeue, true);
      requeued++;
      return Promise.resolve();
    },
    extendVisibility: () => Promise.resolve(true),
  };
  const result = processWorkerTask(context, {
    taskId: 'cancel',
    topic: 'tasks',
    triggeredBy: 'queue',
    payload: { duration: 60_000 },
  }, delivery);
  await started.promise;
  await delay(100);
  shutdown.abort();
  await bounded(result, 5_000);
  assertEquals(requeued, 1, 'shutdown requeues without rejecting the listener handler');
  const retry = await store.claim({
    concept: 'task',
    targetId: 'cancel',
    messageId: delivery.messageId,
    deliveryCount: 2,
  });
  assertEquals(retry.claimed, true);
  assertEquals(retry.alreadyApplied, false);
});
