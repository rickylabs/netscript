import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import { bounded } from '../../../packages/queue/tests/_fixtures/redis-lease-harness.ts';
import { recoveryContext } from './test_utils/redis-worker-context.ts';
import { processWorkerJob } from './job-dispatcher.ts';

for (const mode of ['business', 'deadline', 'backoff', 'cancel'] as const) {
  Deno.test(`shutdown does not refund an earlier ${mode} cause`, async () => {
    await using kv = new MemoryKvAdapter();
    const shutdown = new AbortController();
    const waiting = Promise.withResolvers<void>();
    const context = recoveryContext(new KvWorkerIdempotencyStore({ kv }), {
      execute: (_definition, options) => {
        if (mode === 'backoff') {
          return Promise.resolve({ success: false, duration: 1, error: 'business failure' });
        }
        if (mode === 'cancel') {
          const active = [...context.activeJobs.values()][0];
          assert(active);
          active.abortController.abort(new DOMException('Operator first.', 'AbortError'));
        }
        shutdown.abort(new DOMException('Later shutdown.', 'ShutdownError'));
        if (mode === 'business') throw new Error('Handler first.');
        if (mode === 'deadline') throw new DOMException('Deadline first.', 'TimeoutError');
        assert(options.signal instanceof AbortSignal);
        return Promise.resolve({ success: false, duration: 1 });
      },
    }, shutdown.signal);
    const dispatch = {
      ...context,
      registry: {
        get: async (id: string) => {
          const definition = await context.registry.get(id);
          return definition &&
            { ...definition, maxRetries: mode === 'backoff' ? 2 : 0, retryDelay: 1_000 };
        },
      },
      retryClock: {
        now: () => 0,
        schedule: () => {
          waiting.resolve();
          return () => {};
        },
      },
    };
    const queue = new MemoryQueueAdapter<JobMessage>();
    await queue.enqueue({ jobId: 'cause', topic: 'jobs', triggeredBy: 'queue' });
    const firstStop = new AbortController();
    const first = queue.listen(async (message, delivery) => {
      await processWorkerJob(dispatch, message, delivery);
      firstStop.abort();
    }, { signal: firstStop.signal });
    void first.catch(() => {});
    try {
      if (mode === 'backoff') {
        await bounded(waiting.promise);
        shutdown.abort(new DOMException('Later shutdown.', 'ShutdownError'));
      }
      await bounded(first);
      const nextStop = new AbortController();
      const delivered = Promise.withResolvers<void>();
      const next = queue.listen(async (_message, delivery) => {
        try {
          assertEquals(delivery.deliveryCount, 2);
          await delivery.ack();
          delivered.resolve();
        } catch (error) {
          delivered.reject(error);
          throw error;
        } finally {
          nextStop.abort();
        }
      }, { signal: nextStop.signal });
      try {
        await bounded(delivered.promise);
      } finally {
        nextStop.abort();
        await bounded(next);
      }
    } finally {
      firstStop.abort();
      shutdown.abort();
      await bounded(first);
      await queue.stop();
    }
  });
}
