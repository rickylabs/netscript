import { assertEquals } from '@std/assert';
import { createWatcher } from '../mod.ts';

Deno.test('FileWatcher watch loop stops when the external signal aborts', async () => {
  const tmpDir = await Deno.makeTempDir();
  const controller = new AbortController();
  const watcher = createWatcher({
    paths: [tmpDir],
    patterns: ['*.txt'],
    events: ['create'],
    forcePolling: true,
    pollIntervalMs: 1,
    contentHash: false,
    signal: controller.signal,
  });

  try {
    const iterator = watcher.watch()[Symbol.asyncIterator]();
    const next = iterator.next();

    await new Promise((resolve) => setTimeout(resolve, 20));
    assertEquals(watcher.running, true);

    controller.abort();
    watcher.stop();

    const result = await next;
    assertEquals(result.done, true);
    assertEquals(watcher.running, false);

    await iterator.return?.(undefined);
  } finally {
    watcher.stop();
    await Deno.remove(tmpDir, { recursive: true });
  }
});
