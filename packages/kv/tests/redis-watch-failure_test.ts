import { assertEquals, assertRejects } from '@std/assert';
import { deadline } from '@std/async';
import { KvClosedError } from '../mod.ts';
import { WatchBatchQueue } from '../adapters/redis/watch-batch-queue.ts';

for (const debounce of [undefined, 30_000]) {
  Deno.test(`Redis watch queue: typed failure interrupts ${debounce ? 'debounce' : 'idle wait'}`, async () => {
    const queue = new WatchBatchQueue<number>();
    if (debounce) queue.push(1);
    const pending = queue.next(debounce);
    queue.fail(new KvClosedError('closed'));
    await assertRejects(() => deadline(pending, 500), KvClosedError, 'closed');
    await assertRejects(() => queue.next(), KvClosedError, 'closed');
  });
}

Deno.test('Redis watch queue: caller abort takes precedence over terminal failure', async () => {
  const queue = new WatchBatchQueue<number>();
  const controller = new AbortController();
  const pending = queue.next(undefined, controller.signal);
  controller.abort();
  queue.fail(new KvClosedError('closed'));
  assertEquals(await pending, []);
  assertEquals(await queue.next(undefined, controller.signal), []);
});
