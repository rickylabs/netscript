import { assertEquals, assertRejects } from '@std/assert';
import { deadline, delay } from '@std/async';
import { basename } from '@std/path';
import { PollingStrategy } from '../src/strategies/polling.ts';
import { createWatcher, type WatcherErrorEvent } from '../mod.ts';

Deno.test({
  name: 'polling never announces readiness when the initial root cannot be read',
  ignore: Deno.build.os === 'windows' ||
    Deno.permissions.querySync({ name: 'sys', kind: 'uid' }).state !== 'granted' ||
    Deno.uid() === 0,
  async fn() {
    const root = await Deno.makeTempDir();
    const failures: WatcherErrorEvent[] = [];
    let ready = false;
    const watcher = createWatcher({
      paths: [root],
      strategy: 'polling',
      pollIntervalMs: 500,
      onReady: () => {
        ready = true;
      },
      onError: (event) => {
        failures.push(event);
      },
    });
    const iterator = watcher.watch();
    let next: ReturnType<typeof iterator.next> | undefined;
    try {
      await Deno.chmod(root, 0o000);
      assertEquals((await Deno.stat(root)).isDirectory, true);
      const pending = iterator.next();
      next = pending;
      void pending.catch(() => {});
      const error = await assertRejects(() => deadline(pending, 1500), Error);
      assertEquals(ready, false);
      assertEquals(failures.length, 1);
      assertEquals(failures[0].error, error);
      assertEquals(watcher.running, false);
    } finally {
      watcher.stop();
      await next?.catch(() => {});
      await iterator.return(undefined);
      await Deno.chmod(root, 0o700);
      await Deno.remove(root);
    }
  },
});

Deno.test('polling preserves startup grace when an unavailable share returns before the next attempt', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/share`;
  const controller = new AbortController();
  const ready = Promise.withResolvers<void>();
  let readyCount = 0;
  const strategy = new PollingStrategy({
    paths: [root],
    pollIntervalMs: 500,
    signal: controller.signal,
    onReady: () => {
      readyCount++;
      ready.resolve();
    },
  });
  const iterator = strategy.watch()[Symbol.asyncIterator]();
  const next = iterator.next();
  void next.catch(() => {});
  try {
    await delay(25);
    assertEquals(readyCount, 0);
    await Deno.mkdir(root);
    await deadline(ready.promise, 1500);
    assertEquals(readyCount, 1);
    await Deno.writeTextFile(`${root}/after.txt`, 'after share recovery');
    const event = await deadline(next, 1500);
    assertEquals(event.done, false);
    assertEquals(event.value?.kind, 'create');
    assertEquals(basename(event.value?.path ?? ''), 'after.txt');
  } finally {
    controller.abort();
    await next.catch(() => {});
    await iterator.return?.();
    await Deno.remove(directory, { recursive: true });
  }
});
