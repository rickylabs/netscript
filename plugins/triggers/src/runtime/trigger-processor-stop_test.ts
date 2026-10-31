import { assertEquals } from '@std/assert';
import { deadline } from 'jsr:@std/async@^1';
import { stub } from 'jsr:@std/testing@^1/mock';
import { DenoKvAdapter } from '@netscript/kv';
import { defineFileWatch } from '@netscript/plugin-triggers-core/builders';
import {
  CronTriggerSchedulerAdapter,
  WatchersFileWatcherAdapter,
} from '@netscript/plugin-triggers-core/adapters';
import { createTriggerProcessor } from '@netscript/plugin-triggers-core/runtime';
import {
  KvTriggerDlqStore,
  KvTriggerIdempotencyStore,
} from '@netscript/plugin-triggers-core/stores';
import { startTriggerProcessorRuntime } from './trigger-processor.ts';

for (const sourceFails of [false, true]) {
  Deno.test(`shutdown drains a hashing observation before closing admission (source stop failure: ${sourceFails})`, async () => {
    const directory = await Deno.makeTempDir({ prefix: 'trigger-stop-' });
    const kv = new DenoKvAdapter(await Deno.openKv(`${directory}/kv.sqlite3`));
    const controller = new AbortController();
    const hashing = Promise.withResolvers<void>();
    const releaseHash = Promise.withResolvers<void>();
    const sourceStopping = Promise.withResolvers<void>();
    const errors: unknown[] = [];
    let calls = 0;
    const definition = defineFileWatch(() => {
      calls++;
      return Promise.resolve([]);
    }, { id: 'shutdown-watch', paths: [directory], patterns: ['*.json'], on: ['modify'] });
    const processor = createTriggerProcessor({
      idempotency: new KvTriggerIdempotencyStore({ kv }),
      dlq: new KvTriggerDlqStore({ kv }),
    });
    const watcher = new WatchersFileWatcherAdapter({
      watcherFactory: () => ({
        async *watch() {
          yield {
            path: `${directory}/state.json`,
            kind: 'modify',
            timestamp: new Date('2026-10-31T00:00:00Z'),
            fileInfo: { modifiedAt: new Date('2026-10-31T00:00:00Z'), size: 12 },
          };
        },
        stop: () => sourceStopping.resolve(),
      }),
      onError: (error) => {
        errors.push(error);
      },
    });
    const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
    using _digest = stub(crypto.subtle, 'digest', async (...args) => {
      hashing.resolve();
      await releaseHash.promise;
      return await originalDigest(...args);
    });
    const scheduler = new CronTriggerSchedulerAdapter({ schedulerOptions: { provider: 'memory' } });
    const stopScheduler = scheduler.stop.bind(scheduler);
    const sourceFailure = new Error('scheduler stop failed');
    using _stop = sourceFails
      ? stub(scheduler, 'stop', () => Promise.reject(sourceFailure))
      : undefined;
    const running = startTriggerProcessorRuntime({
      signal: controller.signal,
      definitions: [definition],
      processor,
      scheduler,
      fileWatcher: watcher,
    });
    const outcome = running.then(() => undefined, (error: unknown) => error);
    try {
      await deadline(hashing.promise, 5_000);
      controller.abort();
      await deadline(sourceStopping.promise, 5_000);
      releaseHash.resolve();
      assertEquals(await deadline(outcome, 5_000), sourceFails ? sourceFailure : undefined);
      assertEquals(calls, 1, 'the observed change must complete before processor admission closes');
      assertEquals(errors, []);
      assertEquals(await new KvTriggerDlqStore({ kv }).list(), []);
    } finally {
      releaseHash.resolve();
      controller.abort();
      await outcome;
      await stopScheduler();
      await kv.close();
      await Deno.remove(directory, { recursive: true });
    }
  });
}
