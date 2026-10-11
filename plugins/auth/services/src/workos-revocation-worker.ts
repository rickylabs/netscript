import { delay } from '@std/async/delay';
import { revokeWorkosSubjectPage } from '@netscript/auth-workos';
import type {
  WorkosRevocationClient,
  WorkosRevocationDelivery,
  WorkosRevocationStore,
} from '@netscript/auth-workos';
import { InProcessJobRunner } from '@netscript/plugin-workers-core/runtime';
import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';

/** Identifier-free failure classification; raw provider errors may contain credentials. */
export type WorkosWorkerFailure = 'delivery' | 'storage';

/** Lifecycle of the service-owned durable WorkOS cleanup worker. */
export interface WorkosRevocationWorker {
  /** Consume durable jobs until stopped; storage and provider failures are supervised. */
  start(onFailure?: (stage: WorkosWorkerFailure) => Promise<void> | void): Promise<void>;
  /** Abort admission and drain the worker runner. */
  stop(): Promise<void>;
}

/** Runtime dependencies for deterministic scheduling and a shared clock-skew policy. */
export interface WorkosRevocationWorkerOptions {
  /** Abortable wait; defaults to the standard-library delay. */
  readonly wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

/** Compose a supervised serial worker; one bounded WorkOS page per runner dispatch. */
export function createWorkosRevocationWorker(
  store: WorkosRevocationStore,
  workos: WorkosRevocationClient,
  now: () => number = Date.now,
  options: WorkosRevocationWorkerOptions = {},
): WorkosRevocationWorker {
  const controller = new AbortController();
  const wait = options.wait ?? ((ms, signal) => delay(ms, { signal }));
  const runner = new InProcessJobRunner({ id: 'auth-workos-revocation' });
  const definition: JobDefinition<string, WorkosRevocationDelivery, void> = {
    id: 'auth-workos-revoke-subject',
    timeout: 30_000,
    handler: async ({ payload, signal }) => {
      await revokeWorkosSubjectPage(store, workos, payload, signal, 50);
      return { success: true };
    },
  };
  let completion: Promise<void> | undefined;
  let onFailure: ((stage: WorkosWorkerFailure) => Promise<void> | void) | undefined;

  async function report(stage: WorkosWorkerFailure): Promise<void> {
    try {
      await onFailure?.(stage);
    } catch {
      // Observability must never stop durable revocation processing.
    }
  }

  async function pause(milliseconds: number): Promise<void> {
    try {
      await wait(milliseconds, controller.signal);
    } catch {
      // Abort cancels admission; the next loop checks the shutdown signal.
    }
  }

  async function consume(): Promise<void> {
    let idleDelay = 250;
    let storageDelay = 1_000;
    while (!controller.signal.aborted) {
      try {
        const delivery = await store.nextDelivery(now());
        if (!delivery) {
          await pause(idleDelay);
          idleDelay = Math.min(60_000, idleDelay * 2);
          continue;
        }
        idleDelay = 250;
        try {
          const result = await runner.dispatch(definition, {
            id: delivery.job.id,
            job: definition,
            payload: delivery,
            signal: controller.signal,
          });
          if (!result.success) throw new Error('WorkOS revocation delivery failed.');
        } catch {
          if (controller.signal.aborted) break; // Restart replays the uncheckpointed page.
          await report('delivery');
          // Saturate metadata, but never abandon an unfinished subject after an outage.
          const attempt = Math.min(1_000_000, delivery.job.attempt + 1);
          const retryDelay = Math.min(60_000, 1_000 * 2 ** Math.min(6, attempt - 1));
          await store.checkpoint(delivery, {
            ...delivery.job,
            attempt,
            dueAt: now() + retryDelay,
          });
          await pause(retryDelay);
        }
        storageDelay = 1_000;
      } catch {
        if (controller.signal.aborted) break;
        await report('storage');
        await pause(storageDelay);
        storageDelay = Math.min(60_000, storageDelay * 2);
      }
    }
  }

  return {
    start(observer): Promise<void> {
      onFailure ??= observer;
      return completion ??= consume();
    },
    async stop(): Promise<void> {
      controller.abort(new DOMException('Auth service stopping.', 'ShutdownError'));
      await runner.stop();
      await completion;
    },
  };
}
