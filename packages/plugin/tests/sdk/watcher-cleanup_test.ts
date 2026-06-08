import { assertEquals } from '@std/assert';

import { createWatcherHandle, startWatcher } from '../../src/sdk/mod.ts';

Deno.test('watcher handle stop resolves for no-op discovery watcher', async () => {
  const handle = createWatcherHandle();

  await handle.stop();
  await handle.stop();

  assertEquals(typeof handle.stop, 'function');
});

Deno.test('startWatcher returns a cleanup handle', async () => {
  const handle = startWatcher();

  await handle.stop();

  assertEquals(typeof handle.stop, 'function');
});
