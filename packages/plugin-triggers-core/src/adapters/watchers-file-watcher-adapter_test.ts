import { createWatcher } from '@netscript/watchers';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { deadline, delay } from '@std/async';
import { FakeTime } from 'jsr:@std/testing@^1/time';
import type { FileWatchDefinition, TriggerEvent, TriggerId } from '../domain/mod.ts';
import type { FileWatchStatusEvent } from '../ports/mod.ts';
import {
  type RuntimeWatchEvent,
  WatchersFileWatcherAdapter,
} from './watchers-file-watcher-adapter.ts';

function definition(root: string, id = 'incoming'): FileWatchDefinition<string, never, never> {
  return {
    id: id as TriggerId,
    kind: 'file-watch',
    durability: 't1',
    paths: [root],
    patterns: ['*.txt'],
    on: ['create'],
    handler: () => Promise.resolve([]),
  };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt++) {
    if (predicate()) return;
    await delay(10);
  }
  assert(predicate(), 'watch condition did not become true');
}

Deno.test('real watch reports root loss and recovery and delivers a later file', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/incoming`;
  await Deno.mkdir(root);
  const states: FileWatchStatusEvent[] = [];
  const errors: unknown[] = [];
  const events: TriggerEvent<'file-watch'>[] = [];
  const adapter = new WatchersFileWatcherAdapter({
    retry: { initialDelayMs: 10, maxDelayMs: 40 },
    onStatusChange: (event) => {
      states.push(event);
    },
    onError: (error) => {
      errors.push(error);
    },
  });
  try {
    await adapter.watch(definition(root), (event) => {
      events.push(event);
      return Promise.resolve();
    });
    await waitFor(() => states.at(-1)?.state === 'watching');
    await Deno.remove(root, { recursive: true });
    await waitFor(() => states.at(-1)?.state === 'unavailable' && errors.length > 0);
    await Deno.mkdir(root);
    await waitFor(() => states.at(-1)?.state === 'watching');
    await Deno.writeTextFile(`${root}/after.txt`, 'after recovery');
    await waitFor(() =>
      events.some((event) => 'path' in event.payload && event.payload.path === `${root}/after.txt`)
    );
    assertEquals(states.map((event) => event.state), [
      'unavailable',
      'watching',
      'unavailable',
      'watching',
    ]);
    assert(states.every((event) => event.triggerId === 'incoming'));
  } finally {
    await adapter.stop();
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('failed watcher creation retries with capped backoff and unwatch cancels retries', async () => {
  using time = new FakeTime();
  const attempts: number[] = [];
  const adapter = new WatchersFileWatcherAdapter({
    retry: { initialDelayMs: 10, maxDelayMs: 20 },
    watcherFactory: () => {
      attempts.push(Date.now());
      throw new Error('root unavailable');
    },
    onError: () => {
      throw new Error('diagnostic sink failed');
    },
    onStatusChange: () => {
      throw new Error('status sink failed');
    },
  });
  const watch = definition('/unused');
  try {
    await adapter.watch(watch, () => Promise.resolve());
    await time.tickAsync(0);
    await time.runMicrotasks();
    const start = attempts[0];
    await time.tickAsync(9);
    assertEquals(attempts.length, 1);
    await time.tickAsync(1);
    await time.runMicrotasks();
    await time.tickAsync(20);
    await time.runMicrotasks();
    await time.tickAsync(20);
    await time.runMicrotasks();
    assertEquals(attempts.map((at) => at - start), [0, 10, 30, 50]);
    assert(await adapter.unwatch(watch.id));
    await time.tickAsync(100);
    assertEquals(attempts.length, 4);
    assertEquals(await adapter.list(), []);
  } finally {
    await adapter.stop();
  }
});

Deno.test('unexpected iterable completion retries but handler failures do not restart', async () => {
  const errors: unknown[] = [];
  let starts = 0;
  let deliveries = 0;
  const adapter = new WatchersFileWatcherAdapter({
    retry: { initialDelayMs: 5, maxDelayMs: 10 },
    watcherFactory: (options) => ({
      async *watch(): AsyncIterable<RuntimeWatchEvent> {
        starts++;
        if (starts === 1) return;
        await options.onReady?.();
        yield { path: '/incoming/one.txt', kind: 'create', timestamp: new Date() };
        yield { path: '/incoming/two.txt', kind: 'create', timestamp: new Date() };
        await new Promise<void>((resolve) => {
          options.signal?.addEventListener('abort', () => resolve(), { once: true });
        });
      },
      stop: () => {},
    }),
    onError: (error) => {
      errors.push(error);
    },
  });
  try {
    await adapter.watch(definition('/incoming'), () => {
      deliveries++;
      return deliveries === 1 ? Promise.reject(new Error('handler failed')) : Promise.resolve();
    });
    await waitFor(() => deliveries === 2);
    assertEquals(starts, 2);
    assertEquals(errors.length, 2);
  } finally {
    await adapter.stop();
  }
});

Deno.test('pause survives restart and unwatch drains an in-flight handler', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/incoming`;
  await Deno.mkdir(root);
  let state = '';
  let deliveries = 0;
  const handlerGate = Promise.withResolvers<void>();
  const adapter = new WatchersFileWatcherAdapter({
    retry: { initialDelayMs: 5, maxDelayMs: 10 },
    onStatusChange: (event) => {
      state = event.state;
    },
  });
  const watch = definition(root);
  try {
    await adapter.watch(watch, async () => {
      deliveries++;
      await handlerGate.promise;
    });
    await waitFor(() => state === 'watching');
    await adapter.pause(watch.id);
    await Deno.remove(root, { recursive: true });
    await waitFor(() => state === 'unavailable');
    await Deno.mkdir(root);
    await waitFor(() => state === 'watching');
    assertEquals((await adapter.get(watch.id))?.paused, true);
    await Deno.writeTextFile(`${root}/paused.txt`, 'paused');
    await delay(40);
    assertEquals(deliveries, 0);
    await adapter.resume(watch.id);
    await Deno.writeTextFile(`${root}/resumed.txt`, 'resumed');
    await waitFor(() => deliveries > 0);
    let drained = false;
    const removal = adapter.unwatch(watch.id).then(() => {
      drained = true;
    });
    await delay(10);
    assertEquals(drained, false);
    handlerGate.resolve();
    await removal;
    assertEquals(drained, true);
  } finally {
    handlerGate.resolve();
    await adapter.stop();
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('watch retry policy rejects unbounded or invalid delays', () => {
  for (
    const retry of [
      { initialDelayMs: 0 },
      { initialDelayMs: Infinity },
      { maxDelayMs: NaN },
      { initialDelayMs: 20, maxDelayMs: 10 },
    ]
  ) {
    assertThrows(() => new WatchersFileWatcherAdapter({ retry }), RangeError);
  }
});

Deno.test({
  name: 'hybrid retries keep an unreadable root unavailable until real recovery',
  ignore: Deno.build.os === 'windows' ||
    Deno.permissions.querySync({ name: 'sys', kind: 'uid' }).state !== 'granted' ||
    Deno.uid() === 0,
  async fn() {
    const root = await Deno.makeTempDir();
    const states: FileWatchStatusEvent[] = [];
    const errors: unknown[] = [];
    let deliveries = 0;
    const adapter = new WatchersFileWatcherAdapter({
      retry: { initialDelayMs: 10, maxDelayMs: 20 },
      watcherFactory: (options) => createWatcher({ ...options, pollIntervalMs: 500 }),
      onStatusChange: (event) => {
        states.push(event);
      },
      onError: (error) => {
        errors.push(error);
      },
    });
    try {
      await Deno.chmod(root, 0o000);
      assertEquals((await Deno.stat(root)).isDirectory, true);
      await adapter.watch(definition(root), () => {
        deliveries++;
        return Promise.resolve();
      });
      await waitFor(() => errors.length >= 2);
      assertEquals(states.map((event) => event.state), ['unavailable']);
      await Deno.chmod(root, 0o700);
      await waitFor(() => states.at(-1)?.state === 'watching');
      await Deno.writeTextFile(`${root}/recovered.txt`, 'readable again');
      await waitFor(() => deliveries > 0);
      assertEquals(states.map((event) => event.state), ['unavailable', 'watching']);
    } finally {
      await adapter.stop();
      await Deno.chmod(root, 0o700);
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test('watch callbacks can await cancellation without waiting for their own task', async (test) => {
  for (const kind of ['handler', 'error', 'status', 'stop']) {
    await test.step(kind, async () => {
      const root = await Deno.makeTempDir();
      const watch = definition(kind === 'error' ? `${root}/missing` : root);
      const ready = Promise.withResolvers<void>();
      const completed = Promise.withResolvers<void>();
      const cancel = async (): Promise<void> => {
        if (kind === 'stop') await adapter.stop();
        else assert(await adapter.unwatch(watch.id));
        completed.resolve();
      };
      const adapter: WatchersFileWatcherAdapter = new WatchersFileWatcherAdapter({
        onStatusChange: async (event) => {
          if (event.state !== 'watching') return;
          ready.resolve();
          if (kind === 'status') await cancel();
        },
        onError: kind === 'error' ? cancel : undefined,
      });
      try {
        await adapter.watch(watch, async () => {
          if (kind === 'handler' || kind === 'stop') await cancel();
        });
        if (kind === 'handler' || kind === 'stop') {
          await deadline(ready.promise, 1500);
          await Deno.writeTextFile(`${root}/cancel.txt`, 'cancel this watch');
        }
        await deadline(completed.promise, 1500);
        await deadline(adapter.stop(), 1500);
        assertEquals(await adapter.list(), []);
      } finally {
        // Bound cleanup in the reverted-fix control, whose task is self-awaiting.
        await deadline(adapter.stop(), 100).catch(() => {});
        await Deno.remove(root, { recursive: true });
      }
    });
  }
});

Deno.test('callback cancellation still works after the same adapter drains and registers again', async () => {
  const root = await Deno.makeTempDir();
  const watch = definition(root);
  let ready = Promise.withResolvers<void>();
  let completed = Promise.withResolvers<void>();
  const adapter = new WatchersFileWatcherAdapter({
    onStatusChange: (event) => {
      if (event.state === 'watching') ready.resolve();
    },
  });
  try {
    for (let iteration = 0; iteration < 2; iteration++) {
      ready = Promise.withResolvers<void>();
      completed = Promise.withResolvers<void>();
      await adapter.watch(watch, async () => {
        assert(await adapter.unwatch(watch.id));
        completed.resolve();
      });
      await deadline(ready.promise, 1500);
      await Deno.writeTextFile(
        `${root}/iteration-${iteration}.txt`,
        'cancel after reusing adapter',
      );
      await deadline(completed.promise, 1500);
      await deadline(adapter.stop(), 1500);
      assertEquals(await adapter.list(), []);
    }
  } finally {
    await deadline(adapter.stop(), 100).catch(() => {});
    await Deno.remove(root, { recursive: true });
  }
});
