import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { deadline, delay } from 'jsr:@std/async@^1';
import { DenoKvAdapter, type KvStore } from '@netscript/kv';
import { createWatcher } from '@netscript/watchers';
import {
  defineFileWatch,
  defineScheduledTrigger,
  defineWebhook,
} from '@netscript/plugin-triggers-core/builders';
import {
  type RuntimeWatchEvent,
  type RuntimeWatchFileInfo,
  WatchersFileWatcherAdapter,
} from '@netscript/plugin-triggers-core/adapters';
import {
  TriggerDeduplicatedError,
  type TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';
import { createTriggerProcessor } from '@netscript/plugin-triggers-core/runtime';
import {
  KvTriggerDlqStore,
  KvTriggerIdempotencyStore,
} from '@netscript/plugin-triggers-core/stores';

const NOW = new Date('2026-10-30T12:00:00.000Z');
const SNAPSHOT = { modifiedAt: NOW, size: 12 };
const RAW: RuntimeWatchEvent = { path: '/incoming/state.json', kind: 'modify', timestamp: NOW };
const FILE_SPEC = {
  id: 'file-change',
  paths: ['/incoming'],
  patterns: ['*.json'],
  on: ['modify'] as const,
};

for (
  const [label, fileInfo] of [
    ['missing', undefined],
    ['partial', { size: 12 }],
    ['null mtime', { size: 12, modifiedAt: null }],
  ] satisfies Array<[string, RuntimeWatchFileInfo | undefined]>
) {
  Deno.test(`disk KV: two modifies seconds apart both reach the default handler (${label} metadata)`, async () => {
    await withDisk(async (open) => {
      const kv = await open();
      const events = await adapterEvents([
        { ...RAW, fileInfo },
        { ...RAW, fileInfo, timestamp: new Date(NOW.getTime() + 2_000) },
      ]);
      const handled: TriggerEvent[] = [];
      const definition = defineFileWatch((event) => {
        handled.push(event);
        return Promise.resolve([]);
      }, FILE_SPEC);
      const processor = processorFor(kv);
      try {
        await processor.process(events[0], definition);
        await delay(2_000);
        await processor.process(events[1], definition);
        assertEquals(handled, events);
      } finally {
        await processor.stop();
      }
    });
  });
}

for (const fileInfo of [undefined, SNAPSHOT]) {
  Deno.test(`disk KV restart: ${fileInfo ? 'same snapshot' : 'missing metadata'} remains eligible after completion`, async () => {
    await withDisk(async (open) => {
      const handled: TriggerEvent[] = [];
      const definition = defineFileWatch((event) => {
        handled.push(event);
        return Promise.resolve([]);
      }, FILE_SPEC);
      const firstKv = await open();
      const first = processorFor(firstKv);
      const [before] = await adapterEvents([{ ...RAW, fileInfo }]);
      try {
        await firstKv.set(['restart-proof'], 'retained');
        await first.process(before, definition);
      } finally {
        await first.stop();
        await firstKv.close();
      }
      const secondKv = await open();
      assertEquals((await secondKv.get(['restart-proof']))?.value, 'retained');
      const second = processorFor(secondKv);
      // A new adapter resets the event counter, while the same durable database survives.
      const [after] = await adapterEvents([{
        ...RAW,
        fileInfo,
        timestamp: new Date(NOW.getTime() + 2_000),
      }]);
      assertEquals(before.id, after.id);
      try {
        await second.process(after, definition);
        assertEquals(handled.length, 2);
        if (fileInfo) assertEquals(before.idempotencyKey, after.idempotencyKey);
      } finally {
        await second.stop();
      }
    });
  });
}

Deno.test('disk KV: a true duplicate is blocked across processors in flight, then eligible again', async () => {
  await withDisk(async (open) => {
    const kv = await open();
    const otherKv = await open();
    const [event] = await adapterEvents([{ ...RAW, fileInfo: SNAPSHOT }]);
    const [duplicate] = await adapterEvents([{
      ...RAW,
      fileInfo: SNAPSHOT,
      timestamp: new Date(NOW.getTime() + 2_000),
    }]);
    assertEquals(event.idempotencyKey, duplicate.idempotencyKey);
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let calls = 0;
    const definition = defineFileWatch(async () => {
      calls++;
      entered.resolve();
      await release.promise;
      return [];
    }, FILE_SPEC);
    const first = processorFor(kv);
    const second = processorFor(otherKv);
    const running = first.process(event, definition);
    try {
      await deadline(entered.promise, 5_000);
      await assertRejects(() => second.process(duplicate, definition), TriggerDeduplicatedError);
      assertEquals(calls, 1);
    } finally {
      release.resolve();
      await running;
      await first.stop();
    }
    try {
      await second.process(duplicate, definition);
      assertEquals(calls, 2);
    } finally {
      await second.stop();
    }
  });
});

Deno.test('disk KV: distinct observations without metadata can run concurrently across processors', async () => {
  await withDisk(async (open) => {
    const kv = await open();
    const otherKv = await open();
    const [event, next] = await adapterEvents([RAW, RAW]);
    const firstEntered = Promise.withResolvers<void>();
    const bothEntered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let calls = 0;
    const definition = {
      ...defineFileWatch(async () => {
        calls++;
        firstEntered.resolve();
        if (calls === 2) bothEntered.resolve();
        await release.promise;
        return [];
      }, FILE_SPEC),
      concurrency: { limit: 2 },
    };
    const first = processorFor(kv);
    const second = processorFor(otherKv);
    const running = first.process(event, definition);
    let other: Promise<unknown> | undefined;
    try {
      await deadline(firstEntered.promise, 5_000);
      other = second.process(next, definition).catch((error: unknown) => error);
      await deadline(Promise.race([bothEntered.promise, other]), 5_000);
      assertEquals(calls, 2, 'distinct changes must not share an active payload-hash claim');
      assertNotEquals(event.idempotencyKey, next.idempotencyKey);
    } finally {
      release.resolve();
      await Promise.all([running, other]);
      await Promise.all([first.stop(), second.stop()]);
    }
  });
});

Deno.test('disk KV: changed snapshots and long paths process with an explicit completed TTL', async () => {
  await withDisk(async (open) => {
    const kv = await open();
    const path = `/incoming/${'directory/'.repeat(240)}state.json`;
    assert(new TextEncoder().encode(path).length > 2_048);
    const events = await adapterEvents([
      { ...RAW, path, fileInfo: SNAPSHOT },
      { ...RAW, path, fileInfo: { ...SNAPSHOT, modifiedAt: new Date(NOW.getTime() + 2_000) } },
      { ...RAW, path, fileInfo: { ...SNAPSHOT, size: 13 } },
    ]);
    let calls = 0;
    const definition = {
      ...defineFileWatch(() => {
        calls++;
        return Promise.resolve([]);
      }, FILE_SPEC),
      deduplication: { ttlMs: 60_000, payloadHashFallback: true },
    };
    const processor = processorFor(kv);
    try {
      for (const event of events) {
        if (event.idempotencyKey !== undefined) assert(event.idempotencyKey.length < 100);
        await processor.process(event, definition);
      }
      await assertRejects(() => processor.process(events[0], definition), TriggerDeduplicatedError);
      assertEquals(calls, 3);
    } finally {
      await processor.stop();
    }
  });
});

Deno.test('disk KV: webhook and scheduled defaults retain 24 hours and explicit file TTLs prevail', async () => {
  await withDisk(async (open) => {
    const kv = await open();
    const store = new KvTriggerIdempotencyStore({ kv });
    const completedTtls: number[] = [];
    const processor = createTriggerProcessor({
      idempotency: {
        resolveKey: (input) => store.resolveKey(input),
        release: (key) => store.release(key),
        markCompleted: (key, ttlMs) => {
          completedTtls.push(ttlMs);
          return store.markCompleted(key, ttlMs);
        },
      },
      dlq: new KvTriggerDlqStore({ kv }),
    });
    const noop = () => Promise.resolve([]);
    const definitions = [
      defineWebhook(noop, { id: 'webhook-default', path: '/hook', verifier: 'memory' }),
      defineScheduledTrigger(noop, { id: 'scheduled-default', cron: '* * * * *' }),
      ...[0, 60_000].map((ttlMs) => ({
        ...defineFileWatch(noop, { ...FILE_SPEC, id: `file-override-${ttlMs}` }),
        deduplication: { ttlMs, payloadHashFallback: true },
      })),
    ];
    const [observed] = await adapterEvents([RAW]);
    try {
      for (const definition of definitions) {
        await processor.process({
          ...observed,
          triggerId: definition.id,
          kind: definition.kind,
          idempotencyKey: definition.id,
        }, definition);
      }
      assertEquals(completedTtls, [86_400_000, 86_400_000, 0, 60_000]);
    } finally {
      await processor.stop();
    }
  });
});

Deno.test('real filesystem watcher: two modifications seconds apart process when metadata is unavailable', async () => {
  await withDisk(async (open, directory) => {
    const kv = await open();
    const processor = processorFor(kv);
    const path = `${directory}/state.json`;
    await Deno.writeTextFile(path, 'initial');
    const outcomes = Array.from({ length: 3 }, () => Promise.withResolvers<void>());
    const errors: unknown[] = [];
    let calls = 0;
    const definition = defineFileWatch(() => {
      outcomes[calls++].resolve();
      return Promise.resolve([]);
    }, { ...FILE_SPEC, paths: [directory], on: ['create', 'modify'] });
    const adapter = new WatchersFileWatcherAdapter({
      watcherFactory: (options) => {
        const watcher = createWatcher({
          ...options,
          events: ['create', 'modify'],
          processExisting: true,
          forcePolling: true,
          pollIntervalMs: 500,
        });
        return {
          async *watch() {
            // Exercise actual filesystem detection with a provider that cannot report stat info.
            for await (const event of watcher.watch()) yield { ...event, fileInfo: null };
          },
          stop: () => watcher.stop(),
        };
      },
      onError: (error) => {
        errors.push(error);
        outcomes[calls]?.reject(error);
      },
    });
    try {
      await adapter.watch(definition, async (event) => {
        await processor.process(event, definition);
      });
      await deadline(outcomes[0].promise, 5_000);
      // Allow the polling strategy to establish its initial filesystem snapshot.
      await delay(1_000);
      await Deno.writeTextFile(path, 'first modification');
      await deadline(outcomes[1].promise, 5_000);
      await delay(2_000);
      await Deno.writeTextFile(path, 'second modification');
      await deadline(outcomes[2].promise, 5_000);
      assertEquals(calls, 3);
      assertEquals(errors, []);
    } finally {
      await adapter.stop();
      await processor.stop();
    }
  });
});

/** Only the raw observation source is synthetic; the adapter and event construction are real. */
async function adapterEvents(observations: readonly RuntimeWatchEvent[]): Promise<TriggerEvent[]> {
  const finished = Promise.withResolvers<void>();
  const sourceStopped = Promise.withResolvers<void>();
  const events: TriggerEvent[] = [];
  const errors: unknown[] = [];
  const adapter = new WatchersFileWatcherAdapter({
    watcherFactory: () => ({
      async *watch() {
        try {
          yield* observations;
          finished.resolve();
          await sourceStopped.promise;
        } finally {
          finished.resolve();
        }
      },
      stop: () => sourceStopped.resolve(),
    }),
    onError: (error) => {
      errors.push(error);
    },
  });
  try {
    await adapter.watch(defineFileWatch(() => Promise.resolve([]), FILE_SPEC), (event) => {
      events.push(event);
      return Promise.resolve();
    });
    await deadline(finished.promise, 5_000);
    assertEquals(errors, []);
    assertEquals(events.length, observations.length);
    return events;
  } finally {
    await adapter.stop();
  }
}

function processorFor(kv: KvStore): ReturnType<typeof createTriggerProcessor> {
  return createTriggerProcessor({
    idempotency: new KvTriggerIdempotencyStore({ kv }),
    dlq: new KvTriggerDlqStore({ kv }),
  });
}

/** Reopen one on-disk database, closing every owned handle even when a negative control fails. */
async function withDisk(
  test: (open: () => Promise<KvStore>, directory: string) => Promise<void>,
): Promise<void> {
  const directory = await Deno.makeTempDir({ prefix: 'file-watch-kv-' });
  const handles: KvStore[] = [];
  const open = async (): Promise<KvStore> => {
    const kv = new DenoKvAdapter(await Deno.openKv(`${directory}/kv.sqlite3`));
    handles.push(kv);
    return kv;
  };
  try {
    await test(open, directory);
  } finally {
    for (const kv of handles) await kv.close();
    await Deno.remove(directory, { recursive: true });
  }
}
