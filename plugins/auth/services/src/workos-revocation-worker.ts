import { delay } from 'jsr:@std/async@^1/delay';
import { revokeWorkosSubjectPage } from '@netscript/auth-workos';
import type { WorkosRevocationClient, WorkosRevocationStore } from '@netscript/auth-workos';
import { InProcessJobRunner } from '@netscript/plugin-workers-core/runtime';
import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';
import type { WorkosRevocationDelivery } from '@netscript/auth-workos';

/** Lifecycle of the service-owned durable WorkOS cleanup worker. */
export interface WorkosRevocationWorker {
  /** Consume durable jobs until stopped. Call once; observe the returned failure. */
  start(): Promise<void>;
  /** Abort admission and drain the worker runner. */
  stop(): Promise<void>;
}

/** Compose a serial background worker; one bounded WorkOS page per runner dispatch. */
export function createWorkosRevocationWorker(
  store: WorkosRevocationStore,
  workos: WorkosRevocationClient,
  now: () => number = Date.now,
): WorkosRevocationWorker {
  const controller = new AbortController();
  const runner = new InProcessJobRunner({ id: 'auth-workos-revocation' });
  const definition: JobDefinition<string, WorkosRevocationDelivery, void> = {
    id: 'auth-workos-revoke-subject',
    timeout: 30_000,
    handler: async ({ payload, signal }) => {
      await revokeWorkosSubjectPage(store, workos, payload, signal);
      return { success: true };
    },
  };
  let completion: Promise<void> | undefined;

  async function consume(): Promise<void> {
    while (!controller.signal.aborted) {
      const delivery = await store.nextDelivery(now());
      if (!delivery) {
        try {
          await delay(250, { signal: controller.signal });
        } catch (error) {
          if (!controller.signal.aborted) throw error;
        }
        continue;
      }
      try {
        const result = await runner.dispatch(definition, {
          id: delivery.job.id,
          job: definition,
          payload: delivery,
          signal: controller.signal,
        });
        if (!result.success) throw new Error(result.error);
      } catch (error) {
        if (controller.signal.aborted) break; // Leave the durable page for the next service instance.
        const attempt = delivery.job.attempt + 1;
        if (attempt >= 8) {
          // Terminal state stays visible in KV and keeps the subject fenced.
          await store.fail(delivery, error instanceof Error ? error.name : 'upstream_failure');
        } else {
          await store.checkpoint(delivery, {
            ...delivery.job,
            attempt,
            dueAt: now() + Math.min(60_000, 1_000 * 2 ** (attempt - 1)),
          });
        }
      }
    }
  }

  return {
    start(): Promise<void> {
      return completion ??= consume();
    },
    async stop(): Promise<void> {
      controller.abort(new DOMException('Auth service stopping.', 'ShutdownError'));
      await runner.stop();
      await completion;
    },
  };
}
