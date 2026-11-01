import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { KvPollingAdapter } from '@netscript/queue/adapters/kv-polling';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { Worker } from './worker.ts';
import {
  bounded,
  leaseBackends,
  LeaseHarness,
  until,
} from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';

for (const [backend, url] of leaseBackends) {
  Deno.test({
    name: `${backend} repeated lost job leases requeue without restarting the worker listener`,
    ignore: !url,
    async fn() {
      assert(url);
      await using harness = new LeaseHarness(url);
      await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
      const valid = Promise.withResolvers<void>();
      let effects = 0;
      const dispatch = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
        execute: () => {
          effects++;
          valid.resolve();
          return Promise.resolve({ success: true, duration: 1 });
        },
      });
      const jobs = new RedisAdapter<JobMessage>(url, harness.name);
      const worker = new Worker({
        ...dispatch,
        workerId: 'surviving-job-listener',
        queue: {
          nativeRetrial: true,
          enqueue: (message, options) => jobs.enqueue(message, options),
          stop: () => jobs.stop(),
          listen: (handler, options) =>
            jobs.listen(
              (message, delivery) =>
                handler(
                  message,
                  message.jobId === 'lost'
                    ? { ...delivery, extendVisibility: () => Promise.resolve(false) }
                    : delivery,
                ),
              options,
            ),
        },
        taskQueue: new KvPollingAdapter<TaskMessage>({
          kv,
          queueName: `${harness.name}-tasks`,
          pollInterval: 1,
        }),
        listenerInitialBackoffMs: 1,
        listenerMaxBackoffMs: 2,
      });
      const started = worker.start();
      void started.catch(() => {});
      try {
        for (let i = 0; i < 6; i++) {
          await jobs.enqueue({ jobId: 'lost', topic: 'jobs', triggeredBy: 'queue' });
        }
        await until(async () => (await jobs.getHealth()).deadLetterDepth === 6);
        assertEquals(effects, 0);
        assertEquals(
          worker.healthStatus.listeners.find((x) => x.name === 'jobs:jobs')?.restartCount,
          0,
        );
        await jobs.enqueue({ jobId: 'valid', topic: 'jobs', triggeredBy: 'queue' });
        await bounded(valid.promise);
        await until(async () => (await jobs.getHealth()).processing === 0);
        assertEquals(effects, 1);
        assertEquals(worker.healthStatus.listeners.every((x) => x.restartCount === 0), true);
      } finally {
        await worker.stop();
        await bounded(started);
      }
    },
  });

  for (const reason of ['disabled', 'active-duplicate'] as const) {
    Deno.test({
      name: `${backend} repeated ${reason} tasks do not spend the listener restart budget`,
      ignore: !url,
      async fn() {
        assert(url);
        await using harness = new LeaseHarness(url);
        await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
        const store = new KvWorkerIdempotencyStore({ kv });
        if (reason === 'active-duplicate') {
          await store.claim({
            concept: 'task',
            targetId: 'bad',
            idempotencyKey: 'shared',
            messageId: 'another-workers-active-message',
            deliveryCount: 1,
          });
        }
        const valid = Promise.withResolvers<void>();
        let effects = 0;
        let handled = 0;
        const dispatch = recoveryContext(store, {
          execute: () => {
            effects++;
            valid.resolve();
            return Promise.resolve({ success: true, duration: 1 });
          },
        });
        const tasks = new RedisAdapter<TaskMessage>(url, harness.name);
        const worker = new Worker({
          ...dispatch,
          workerId: 'surviving-task-listener',
          queue: new KvPollingAdapter({ kv, queueName: `${harness.name}-jobs`, pollInterval: 1 }),
          taskQueue: {
            nativeRetrial: true,
            enqueue: (message, options) => tasks.enqueue(message, options),
            stop: () => tasks.stop(),
            listen: (handler, options) =>
              tasks.listen(async (message, delivery) => {
                await handler(message, delivery);
                handled++;
              }, options),
          },
          taskRegistry: {
            get: async (id) => {
              const definition = await dispatch.taskRegistry.get(id);
              return definition &&
                { ...definition, enabled: id === 'valid' || reason !== 'disabled' };
            },
          },
          listenerInitialBackoffMs: 1,
          listenerMaxBackoffMs: 2,
        });
        const started = worker.start();
        void started.catch(() => {});
        try {
          for (let i = 0; i < 6; i++) {
            await tasks.enqueue({
              taskId: 'bad',
              topic: 'tasks',
              triggeredBy: 'queue',
              ...(reason === 'active-duplicate' ? { idempotencyKey: 'shared' } : {}),
            });
          }
          await until(async () => {
            const health = await tasks.getHealth();
            return handled >= 6 && health.ready === 0 && health.processing === 0;
          });
          assertEquals(effects, 0);
          assertEquals(
            worker.healthStatus.listeners.find((x) => x.name === 'task:tasks')?.restartCount,
            0,
          );
          assertEquals(
            (await tasks.getHealth()).deadLetterDepth,
            reason === 'active-duplicate' ? 6 : 0,
          );
          await tasks.enqueue({ taskId: 'valid', topic: 'tasks', triggeredBy: 'queue' });
          await bounded(valid.promise);
          await until(() => Promise.resolve(handled >= (reason === 'active-duplicate' ? 31 : 7)));
          assertEquals(effects, 1);
          const listener = worker.healthStatus.listeners.find((x) => x.name === 'task:tasks');
          assertEquals(listener?.restartCount, 0);
          assertEquals(listener?.status, 'running');
        } finally {
          await worker.stop();
          await bounded(started);
        }
      },
    });
  }
}
