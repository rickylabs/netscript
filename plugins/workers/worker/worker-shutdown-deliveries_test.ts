import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import {
  bounded,
  leaseBackends,
  LeaseHarness,
} from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { Worker } from './worker.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: `${backend} eight clean Worker restarts preserve a job beyond the five-delivery limit`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      await using kv = new MemoryKvAdapter();
      const idempotency = new KvWorkerIdempotencyStore({ kv });
      const inspector = harness.queue();
      let identity: string | undefined;
      for (let restart = 0; restart <= 8; restart++) {
        const entered = Promise.withResolvers<void>();
        const processed = Promise.withResolvers<void>();
        let deliveryCount = 0;
        const jobs = new RedisAdapter<JobMessage>(url, harness.name);
        const dispatch = recoveryContext(idempotency, {
          execute: async (_definition, options) => {
            assert(options.signal instanceof AbortSignal);
            const signal = options.signal;
            entered.resolve();
            if (restart < 8) {
              await new Promise<void>((resolve) => {
                signal.addEventListener('abort', () => resolve(), { once: true });
              });
              return { success: false, duration: 1 };
            }
            return { success: true, duration: 1 };
          },
        });
        const workerOptions = {
          ...dispatch,
          drainTimeoutMs: 100,
          abortGracePeriodMs: 20,
          taskQueue: new MemoryQueueAdapter<TaskMessage>(),
          queue: {
            nativeRetrial: jobs.nativeRetrial,
            enqueue: (message: JobMessage) => jobs.enqueue(message),
            stop: () => jobs.stop(),
            listen: (
              handler: Parameters<typeof jobs.listen>[0],
              options?: Parameters<typeof jobs.listen>[1],
            ) =>
              jobs.listen(async (message, delivery) => {
                deliveryCount = delivery.deliveryCount;
                identity ??= delivery.messageId;
                assertEquals(delivery.messageId, identity);
                await handler(message, delivery);
                processed.resolve();
              }, options),
          },
        };
        if (restart === 0) {
          await jobs.enqueue({ jobId: 'healthy', topic: 'jobs', triggeredBy: 'queue' });
        }
        const worker = new Worker(workerOptions);
        const started = worker.start();
        void started.catch(() => {});
        try {
          await bounded(entered.promise);
          assertEquals(deliveryCount, 1, `Shutdown ${restart} consumed a delivery attempt.`);
          if (restart === 8) await bounded(processed.promise);
        } finally {
          await bounded(worker.stop());
          await bounded(started);
        }
        assertEquals((await inspector.getHealth()).deadLetterDepth, 0);
      }
      const health = await inspector.getHealth();
      assertEquals(health.ready, 0);
      assertEquals(health.processing, 0);
      assertEquals(health.deadLetterDepth, 0);
    },
  });
}
