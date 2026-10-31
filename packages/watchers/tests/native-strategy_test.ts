import { assert, assertEquals, assertRejects } from '@std/assert';
import { spy } from 'jsr:@std/testing@^1/mock';
import { deadline } from '@std/async';
import { createWatcher, type WatcherErrorEvent } from '../mod.ts';
import { PollingStrategy } from '../src/strategies/polling.ts';

Deno.test({
  name: 'native-only setup failure emits an error event without entering polling',
  ignore: Deno.build.os === 'windows' ||
    Deno.permissions.querySync({ name: 'sys', kind: 'uid' }).state !== 'granted' ||
    Deno.uid() === 0,
  async fn() {
    const root = await Deno.makeTempDir();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const failures: WatcherErrorEvent[] = [];
    let ready = false;
    using native = spy(Deno, 'watchFs');
    using polling = spy(PollingStrategy.prototype, 'watch');
    const watcher = createWatcher({
      paths: [root],
      strategy: 'native',
      signal: controller.signal,
      onReady: () => {
        ready = true;
      },
      onError: (event) => {
        failures.push(event);
      },
    });
    try {
      await Deno.chmod(root, 0o000);
      assert((await Deno.stat(root)).isDirectory);
      const error = await assertRejects(() => watcher.watch().next(), Deno.errors.PermissionDenied);
      assertEquals(native.calls.length, 1, 'the real native API must be attempted');
      assertEquals(polling.calls.length, 0);
      assertEquals(failures.length, 1);
      assertEquals(failures[0].type, 'error');
      assertEquals(failures[0].paths, [root]);
      assertEquals(failures[0].error, error);
      assert(failures[0].timestamp instanceof Date);
      assertEquals(ready, false);
      assertEquals(watcher.running, false);
    } finally {
      clearTimeout(timeout);
      watcher.stop();
      await Deno.chmod(root, 0o700);
      await Deno.remove(root);
    }
  },
});

Deno.test('native-only root removal emits an error before iterator rejection without polling', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/incoming`;
  await Deno.mkdir(root);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  const ready = Promise.withResolvers<void>();
  const failures: WatcherErrorEvent[] = [];
  using polling = spy(PollingStrategy.prototype, 'watch');
  const watcher = createWatcher({
    paths: [root],
    strategy: 'native',
    events: ['create'],
    signal: controller.signal,
    onReady: () => {
      ready.resolve();
    },
    onError: (event) => {
      failures.push(event);
    },
  });
  const iterator = watcher.watch();
  const next = iterator.next();
  void next.catch(() => {});
  try {
    await deadline(ready.promise, 3000);
    await Deno.remove(root, { recursive: true });
    const error = await assertRejects(() => next, Deno.errors.NotFound);
    assertEquals(failures.length, 1);
    assertEquals(failures[0].error, error);
    assertEquals(failures[0].type, 'error');
    assertEquals(polling.calls.length, 0);
    assertEquals(watcher.running, false);
  } finally {
    clearTimeout(timeout);
    watcher.stop();
    await next.catch(() => {});
    await iterator.return(undefined);
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('explicit native overrides forcePolling and delivers real native file events', async () => {
  const root = await Deno.makeTempDir();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  const ready = Promise.withResolvers<void>();
  using native = spy(Deno, 'watchFs');
  using polling = spy(PollingStrategy.prototype, 'watch');
  const watcher = createWatcher({
    paths: [root],
    strategy: 'native',
    forcePolling: true,
    contentHash: false,
    signal: controller.signal,
    onReady: () => {
      ready.resolve();
    },
  });
  const iterator = watcher.watch();
  const next = iterator.next();
  void next.catch(() => {});
  try {
    await deadline(ready.promise, 3000);
    assertEquals(native.calls.length, 1);
    assertEquals(polling.calls.length, 0);
    await Deno.writeTextFile(`${root}/native.txt`, 'native event');
    const event = await next;
    assertEquals(event.done, false);
    assertEquals(event.value?.path, `${root}/native.txt`);
    assertEquals(event.value?.kind, 'create');
  } finally {
    clearTimeout(timeout);
    watcher.stop();
    await next.catch(() => {});
    await iterator.return(undefined);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('native cancellation completes cleanly without an error diagnostic', async () => {
  const root = await Deno.makeTempDir();
  const controller = new AbortController();
  const ready = Promise.withResolvers<void>();
  const failures: WatcherErrorEvent[] = [];
  const watcher = createWatcher({
    paths: [root],
    strategy: 'native',
    signal: controller.signal,
    onReady: () => {
      ready.resolve();
    },
    onError: (event) => {
      failures.push(event);
    },
  });
  const iterator = watcher.watch();
  const next = iterator.next();
  void next.catch(() => {});
  try {
    await deadline(ready.promise, 3000);
    controller.abort();
    assertEquals((await next).done, true);
    assertEquals(failures, []);
    assertEquals(watcher.running, false);
  } finally {
    watcher.stop();
    await next.catch(() => {});
    await iterator.return(undefined);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('watch error diagnostics preserve the original error when the sink fails', async () => {
  const directory = await Deno.makeTempDir();
  let reported: unknown;
  const watcher = createWatcher({
    paths: [`${directory}/missing`],
    strategy: 'native',
    onError: (event) => {
      reported = event.error;
      return Promise.reject(new Error('diagnostic sink failed'));
    },
  });
  try {
    const error = await assertRejects(() => watcher.watch().next(), Deno.errors.NotFound);
    assertEquals(reported, error);
    assertEquals(watcher.running, false);
  } finally {
    watcher.stop();
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('unsupported strategy emits an error and fails closed before acquiring a watcher', async () => {
  const root = await Deno.makeTempDir();
  const failures: WatcherErrorEvent[] = [];
  using native = spy(Deno, 'watchFs');
  using polling = spy(PollingStrategy.prototype, 'watch');
  const watcher = createWatcher({
    paths: [root],
    strategy: 'unsupported',
    onError: (event) => {
      failures.push(event);
    },
  });
  try {
    await assertRejects(() => watcher.watch().next(), TypeError, 'Unsupported watch strategy');
    assertEquals(failures.length, 1);
    assertEquals(native.calls.length, 0);
    assertEquals(polling.calls.length, 0);
  } finally {
    watcher.stop();
    await Deno.remove(root);
  }
});

Deno.test('explicit polling strategy acquires polling without trying native', async () => {
  const root = await Deno.makeTempDir();
  const ready = Promise.withResolvers<void>();
  using native = spy(Deno, 'watchFs');
  using polling = spy(PollingStrategy.prototype, 'watch');
  const watcher = createWatcher({
    paths: [root],
    strategy: 'polling',
    onReady: () => {
      ready.resolve();
    },
  });
  const iterator = watcher.watch();
  const next = iterator.next();
  void next.catch(() => {});
  try {
    await deadline(ready.promise, 3000);
    assertEquals(polling.calls.length, 1);
    assertEquals(native.calls.length, 0);
    watcher.stop();
    assertEquals((await next).done, true);
  } finally {
    watcher.stop();
    await next.catch(() => {});
    await iterator.return(undefined);
    await Deno.remove(root);
  }
});
